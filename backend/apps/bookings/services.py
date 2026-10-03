"""
Atomic multi-vendor checkout (spec §5.1 + Phase-1 Step-2, bookings slice).

Design decisions (WHY):
1. The whole checkout is ONE transaction.atomic() block. Every inventory row
   is locked with select_for_update() BEFORE anything is written, and if any
   single line cannot be fulfilled the whole transaction raises and rolls
   back - locks are released, nothing is half-reserved.
2. Cart lines are sorted by (item_type, entity_id) before locking. Two
   concurrent checkouts that touch the same rows in different orders could
   otherwise deadlock; a stable global order makes that impossible.
3. The Booking row is created ONLY after every line has passed inventory
   checks. No "ghost" booking row can exist for a cart that failed.
4. Prices are snapshotted at checkout time (item_title_snapshot,
   unit_price_snapshot) so later vendor price changes never rewrite history.
5. Every checkout schedules expire_booking_task (Step 4) BEFORE the
   transaction commits. Fail-fast policy: if the broker is unreachable the
   publish raises and the whole checkout rolls back - an unpaid booking can
   never exist without its expiry task (inventory would leak).
6. release_inventory_for_booking() is the SINGLE rollback routine shared by the
   Celery task and any manual recovery path. It mirrors checkout's lock order
   (booking first, then each inventory row) to avoid deadlocks.
7. Payee account details are not hardcoded here; they are provided later via
   configuration when the product owner supplies the receiving account.
"""
import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction

from apps.accommodations.models import (
    AccommodationStatus,
    Room,
    RoomPricingCalendar,
)
from apps.accommodations.services import get_total_room_price
from apps.otop.services import reserve_stock, restore_stock
from apps.payments.services import create_bank_transfer_payment
from apps.services.models import FoodMenu, WellnessTimeSlot

from .models import (
    BOOKING_TTL_MINUTES,
    Booking,
    BookingItem,
    BookingItemType,
    BookingStatus,
)


class CheckoutError(Exception):
    """Business-level checkout failure (mapped to a 4xx envelope in Step 3).

    Attributes:
        code:    stable machine-readable code for the frontend, e.g.
                 ROOM_UNAVAILABLE / INSUFFICIENT_STOCK / SLOT_UNAVAILABLE.
        details: extra context (which date/night, requested vs remaining...).
    """

    def __init__(self, code="CHECKOUT_FAILED", message="Checkout failed.", details=None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)


def _as_uuid(value, field_name="entity_id"):
    """Accept an already-parsed UUID or a valid UUID string."""
    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError) as exc:
        raise CheckoutError(
            "INVALID_ITEM", f"{field_name} is not a valid UUID.", {field_name: value}
        ) from exc


def _as_positive_int(value, field_name="quantity"):
    if not isinstance(value, int) or isinstance(value, bool) or value < 1:
        raise CheckoutError(
            "INVALID_ITEM", f"{field_name} must be a positive integer.", {field_name: value}
        )
    return value


def _as_slot_id(value, field_name="entity_id"):
    """WellnessTimeSlot uses an integer BIGSERIAL pk (spec §2.3), NOT a UUID."""
    if isinstance(value, int) and not isinstance(value, bool) and value >= 1:
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    raise CheckoutError(
        "INVALID_ITEM",
        f"{field_name} must be a positive integer (wellness slot id).",
        {field_name: value},
    )


def _as_date(value, field_name):
    if type(value) is date:
        return value
    raise CheckoutError(
        "INVALID_ITEM", f"{field_name} must be a datetime.date object.", {field_name: value}
    )


def _room_unavailable(message, details=None):
    raise CheckoutError("ROOM_UNAVAILABLE", message, details or {})


def _reserve_room_line(item):
    """Lock the room and decrement every night's available_count.

    Returns a snapshot dict describing the BookingItem to create.
    """
    room_id = _as_uuid(item["entity_id"])
    quantity = _as_positive_int(item.get("quantity", 1))
    checkin = _as_date(item["checkin_date"], "checkin_date")
    checkout = _as_date(item["checkout_date"], "checkout_date")
    if checkin < date.today():
        raise CheckoutError(
            "INVALID_ITEM", "checkin_date cannot be in the past."
        )
    if checkout <= checkin:
        raise CheckoutError(
            "INVALID_ITEM", "checkout_date must be after checkin_date."
        )
    if (checkout - checkin).days > 30:
        raise CheckoutError(
            "INVALID_ITEM", "Stay duration cannot exceed 30 nights."
        )

    room = (
        Room.objects.select_related("accommodation")
        .select_for_update()
        .filter(pk=room_id)
        .first()
    )
    if room is None:
        _room_unavailable("Room not found.")
    if not room.is_active or room.accommodation.status != AccommodationStatus.ACTIVE:
        _room_unavailable("This room is not available for booking.")

    # Nights to be paid, [checkin, checkout).
    stay_days = (checkout - checkin).days
    nights = [checkin + timedelta(days=n) for n in range(stay_days)]

    # Lock every existing calendar row of this room inside the range.
    rows = {
        row.date: row
        for row in RoomPricingCalendar.objects.select_for_update().filter(
            room_id=room.id, date__in=nights
        )
    }

    for night in nights:
        remaining = (
            rows[night].available_count if night in rows else room.total_inventory
        )
        if remaining < quantity:
            _room_unavailable(
                f"Not enough rooms on {night}: {quantity} requested, "
                f"{remaining} left.",
                {"date": str(night), "requested": quantity, "remaining": remaining},
            )
        if night in rows:
            rows[night].available_count -= quantity
            rows[night].save(update_fields=["available_count"])
        else:
            RoomPricingCalendar.objects.create(
                room=room,
                date=night,
                available_count=room.total_inventory - quantity,
            )

    price_per_room = get_total_room_price(room.id, checkin, checkout)
    return {
        "item_type": BookingItemType.ROOM_RESERVATION,
        "entity_id": str(room.id),
        "vendor_id": room.accommodation.owner_id,
        "item_title_snapshot": f"{room.accommodation.name} - {room.name}",
        "unit_price_snapshot": price_per_room,
        "quantity": quantity,
        "total_price": price_per_room * quantity,
        "scheduled_date": checkin,
        "scheduled_end_date": checkout,
        "scheduled_time_slot": None,
    }


def _reserve_food_line(item):
    """Food has no inventory - only check the menu item is still sellable."""
    food_id = _as_uuid(item["entity_id"])
    quantity = _as_positive_int(item.get("quantity", 1))

    food = (
        FoodMenu.objects.select_related("owner").filter(pk=food_id).first()
    )
    if food is None or not food.is_available:
        raise CheckoutError("ITEM_UNAVAILABLE", "This menu item is not available.")

    return {
        "item_type": BookingItemType.FOOD_ORDER,
        "entity_id": str(food.id),
        "vendor_id": food.owner_id,
        "item_title_snapshot": food.name,
        "unit_price_snapshot": food.price,
        "quantity": quantity,
        "total_price": food.price * quantity,
        "scheduled_date": None,
        "scheduled_end_date": None,
        "scheduled_time_slot": None,
    }


def _reserve_wellness_line(item):
    """Lock the wellness slot and decrement its capacity (seats)."""
    slot_id = _as_slot_id(item["entity_id"])
    quantity = _as_positive_int(item.get("quantity", 1))

    slot = (
        WellnessTimeSlot.objects.select_related("service", "service__owner")
        .select_for_update()
        .filter(pk=slot_id)
        .first()
    )
    if slot is None or not slot.service.is_active:
        raise CheckoutError("SLOT_UNAVAILABLE", "This wellness session is not available.")

    if slot.capacity_available < quantity:
        raise CheckoutError(
            "SLOT_UNAVAILABLE",
            f"Only {slot.capacity_available} seat(s) left in this session "
            f"but {quantity} requested.",
            {"requested": quantity, "remaining": slot.capacity_available},
        )

    slot.capacity_available -= quantity
    slot.save(update_fields=["capacity_available"])

    service = slot.service
    return {
        "item_type": BookingItemType.WELLNESS_SESSION,
        "entity_id": str(slot.id),
        "vendor_id": service.owner_id,
        "item_title_snapshot": f"{service.title} @ {slot.slot_date} {slot.start_time}",
        "unit_price_snapshot": service.price,
        "quantity": quantity,
        "total_price": service.price * quantity,
        "scheduled_date": slot.slot_date,
        "scheduled_end_date": None,
        "scheduled_time_slot": str(slot.start_time),
    }


def _reserve_otop_line(item):
    """Reserve stock through the OTOP domain helper (it locks + decrements)."""
    product_id = _as_uuid(item["entity_id"])
    quantity = _as_positive_int(item.get("quantity", 1))

    try:
        product = reserve_stock(product_id, quantity)
    except ValueError as exc:
        raise CheckoutError("STOCK_UNAVAILABLE", str(exc)) from exc

    return {
        "item_type": BookingItemType.OTOP_GOODS,
        "entity_id": str(product.id),
        "vendor_id": product.owner_id,
        "item_title_snapshot": product.name,
        "unit_price_snapshot": product.price,
        "quantity": quantity,
        "total_price": product.price * quantity,
        "scheduled_date": None,
        "scheduled_end_date": None,
        "scheduled_time_slot": None,
    }


def execute_atomic_checkout(cart_items, user, idempotency_key=None):
    """Atomically reserve every cart line and create Booking + Payment.

    Returns a summary dict (booking_code, ids, money breakdown).
    Raises CheckoutError on any unfillable/invalid line; the whole transaction
    rolls back so nothing is left half-reserved.
    """
    if not isinstance(cart_items, list) or not cart_items:
        raise CheckoutError("EMPTY_CART", "Cart is empty.")
    if len(cart_items) > 50:
        raise CheckoutError("TOO_MANY_ITEMS", "Cart cannot contain more than 50 items.")

    line_reservers = {
        BookingItemType.ROOM_RESERVATION: _reserve_room_line,
        BookingItemType.FOOD_ORDER: _reserve_food_line,
        BookingItemType.WELLNESS_SESSION: _reserve_wellness_line,
        BookingItemType.OTOP_GOODS: _reserve_otop_line,
    }

    # Stable global lock order => two concurrent checkouts never deadlock.
    sorted_items = sorted(
        cart_items,
        key=lambda i: (str(i.get("item_type", "")), str(i.get("entity_id", ""))),
    )

    with transaction.atomic():
        lines = []
        subtotal = Decimal("0.00")

        for raw in sorted_items:
            if not isinstance(raw, dict):
                raise CheckoutError("INVALID_ITEM", "Each cart item must be an object.")
            item_type = raw.get("item_type")
            if item_type not in line_reservers:
                raise CheckoutError(
                    "INVALID_ITEM_TYPE", f"Unsupported item_type: {item_type!r}."
                )
            line = line_reservers[item_type](raw)
            lines.append(line)
            subtotal += line["total_price"]

        # No fee rule has been defined in Phase 1, keep it zero (spec default).
        platform_fee = Decimal("0.00")
        net_amount = subtotal + platform_fee

        # Booking is created only after every line passed inventory checks.
        booking = Booking.objects.create(
            user=user,
            status=BookingStatus.AWAITING_PAYMENT,
            total_subtotal=subtotal,
            platform_fee=platform_fee,
            net_amount=net_amount,
            idempotency_key=idempotency_key,
        )
        for line in lines:
            BookingItem.objects.create(booking=booking, **line)

        payment = create_bank_transfer_payment(booking, booking.net_amount)

        # Fail-fast: publish BEFORE commit. If the broker is down this raises,
        # the transaction rolls back and no booking exists without its expiry
        # task. countdown is 15 min >> commit time, so the worker always sees a
        # committed row (no race). Lazy import avoids a services<->tasks cycle.
        from .tasks import expire_booking_task  # noqa: PLC0415

        expire_booking_task.apply_async(
            args=[str(booking.id)],
            countdown=BOOKING_TTL_MINUTES * 60,
        )

    return {
        "booking_id": str(booking.id),
        "booking_code": booking.booking_code,
        "status": booking.status,
        "total_subtotal": str(booking.total_subtotal),
        "platform_fee": str(booking.platform_fee),
        "net_amount": str(booking.net_amount),
        "expires_at": booking.expires_at.isoformat(),
        "payment_id": str(payment.id),
        "payment_channel": payment.payment_channel,
    }


def release_inventory_for_booking(booking):
    """Restore every inventory line of an expired booking (Step 4 rollback).

    MUST be called inside transaction.atomic() with the Booking row already
    locked (booking -> child row order, see module docstring point 6). Each
    line is restored by the same code path the checkout used to reserve it, so
    the two directions always agree.

    Food has no inventory; it is skipped on purpose.
    """
    lines = booking.items.all()

    for item in lines:
        quantity = item.quantity

        if item.item_type == BookingItemType.ROOM_RESERVATION:
            # Room row is the serialization point (mirrors _reserve_room_line).
            room = (
                Room.objects.select_for_update()
                .filter(pk=item.entity_id)
                .first()
            )
            if room is None:
                raise ValueError(
                    f"Room {item.entity_id} no longer exists; cannot restore."
                )

            # Nights paid for, [scheduled_date, scheduled_end_date).
            nights = _nights_between(
                item.scheduled_date, item.scheduled_end_date
            )

            calendar_rows = RoomPricingCalendar.objects.select_for_update().filter(
                room_id=room.id, date__in=nights
            )
            for row in calendar_rows:
                row.available_count += quantity
                row.save(update_fields=["available_count"])

            # Checkout creates a row for every night, so every night is covered.
            found = {row.date for row in calendar_rows}
            missing = set(nights) - found
            if missing:
                raise ValueError(
                    f"Missing calendar rows for room {item.entity_id} "
                    f"on {sorted(missing)}; cannot restore exactly."
                )

        elif item.item_type == BookingItemType.WELLNESS_SESSION:
            # Slot id is an int (BIGSERIAL). Mirrors _reserve_wellness_line.
            slot = (
                WellnessTimeSlot.objects.select_for_update()
                .filter(pk=int(item.entity_id))
                .first()
            )
            if slot is None:
                raise ValueError(
                    f"Wellness slot {item.entity_id} no longer exists; "
                    "cannot restore."
                )
            slot.capacity_available += quantity
            slot.save(update_fields=["capacity_available"])

        elif item.item_type == BookingItemType.OTOP_GOODS:
            # Domain helper locks the product row itself (restore_stock).
            try:
                restore_stock(item.entity_id, quantity)
            except ValueError as exc:
                raise ValueError(
                    f"Could not restore OTOP stock for {item.entity_id}: {exc}"
                ) from exc

        # FOOD_ORDER intentionally skipped: no inventory was held.


def _nights_between(checkin_date, checkout_date):
    """Paid nights [checkin, checkout) - mirrors accommodations helper.

    Local copy keeps bookings/services.py free of cross-app private imports
    while staying consistent with how checkout priced the stay.
    """
    if checkin_date is None or checkout_date is None:
        raise ValueError("Room booking is missing its date range.")
    if checkout_date <= checkin_date:
        raise ValueError("checkout_date must be after checkin_date.")
    return [
        checkin_date + timedelta(days=offset)
        for offset in range((checkout_date - checkin_date).days)
    ]

