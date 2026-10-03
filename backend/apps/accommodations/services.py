"""
Business logic for accommodations (spec §5 / Phase-1 Step-2 list).

Design decisions (WHY):
1. A RoomPricingCalendar row is the single source of truth for one night's
   remaining inventory. A MISSING row means "no booking and no override yet":
   full availability = room.total_inventory, price = room.base_price_per_night.
   Every function here therefore treats calendar rows as deltas layered on top
   of the Room defaults - never as the full story on their own.
2. Availability is expressed as "nights still reservable right now". That value
   already includes AWAITING_PAYMENT holds by construction: the checkout flow
   (bookings/services.py, next slice) decrements available_count the moment the
   Booking row is created, and the 15-minute expiry worker restores it later
   (Step 4). Nothing in this module needs to scan Booking rows to answer "how
   many rooms are left on night X".
3. lock=True is only meaningful inside a transaction.atomic() block (the
   checkout flow). It takes select_for_update() on the Room row, which makes
   that Room the serialization point for every one of its calendar rows: two
   concurrent checkouts of the same room queue up instead of overbooking.
   Public GET endpoints always call with lock=False (no lock, no transaction).
4. Per-night price rule (spec): calendar.price_override wins when not NULL;
   otherwise fall back to room.base_price_per_night.
5. _nights_between() models "nights you pay for" as [checkin, checkout):
   checking in 2026-09-10 and out 2026-09-13 pays for 10, 11 and 12 - exactly
   three nights, never the check-out day.
"""
from datetime import date, timedelta
from decimal import Decimal

from .models import Room, RoomPricingCalendar


def _nights_between(checkin_date, checkout_date):
    """Return the list of paid nights for a stay, [checkin, checkout).

    Raises TypeError for non-date inputs and ValueError when the range is
    empty or inverted, so callers can never silently ask for zero nights.
    """
    if type(checkin_date) is not date or type(checkout_date) is not date:
        raise TypeError(
            "checkin_date and checkout_date must be datetime.date objects."
        )
    if checkout_date <= checkin_date:
        raise ValueError("checkout_date must be after checkin_date.")

    stay_nights = (checkout_date - checkin_date).days
    return [
        checkin_date + timedelta(days=offset) for offset in range(stay_nights)
    ]


def calculate_room_availability(room_id, checkin_date, checkout_date, lock=False):
    """Return {night_date: available_count} for every paid night of the stay.

    available_count for a night is the calendar row's value when a row exists,
    otherwise the room's full total_inventory.

    Arguments:
        lock: pass True ONLY from inside the checkout transaction. It locks the
        Room row with select_for_update() so concurrent writers of the same
        room serialize. Outside a transaction Django rejects this call.
    """
    room_qs = Room.objects.all()
    if lock:
        # Serialize all writers of this room's calendar rows through the room.
        room = room_qs.select_for_update().get(pk=room_id)
    else:
        room = room_qs.get(pk=room_id)

    nights = _nights_between(checkin_date, checkout_date)

    entries = RoomPricingCalendar.objects.filter(room_id=room_id, date__in=nights)
    available_by_date = {entry.date: entry.available_count for entry in entries}

    return {
        night: available_by_date.get(night, room.total_inventory)
        for night in nights
    }


def get_total_room_price(room_id, checkin_date, checkout_date):
    """Return the total price (THB) for ONE room across the whole stay.

    Per-night price = price_override when the date has one, else the room's
    base_price_per_night. Callers multiply the result by the requested room
    quantity when reserving more than one unit.
    """
    room = Room.objects.get(pk=room_id)
    nights = _nights_between(checkin_date, checkout_date)

    overrides = dict(
        RoomPricingCalendar.objects.filter(room_id=room_id, date__in=nights)
        .exclude(price_override__isnull=True)
        .values_list("date", "price_override")
    )

    total = Decimal("0.00")
    for night in nights:
        total += overrides.get(night, room.base_price_per_night)
    return total
