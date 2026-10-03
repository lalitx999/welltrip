"""
Celery tasks for bookings (Step 4: 15-minute payment expiry worker).

WHY the real logic lives in bookings/services.release_inventory_for_booking():
- The rollback must be testable (and callable by other entry points) without
  going through a broker. The task is a thin wrapper: lock the booking, check
  eligibility, then delegate.
"""
import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from apps.payments.models import Payment, PaymentStatus

from .models import Booking, BookingStatus
from .services import release_inventory_for_booking

logger = logging.getLogger(__name__)


@shared_task
def expire_booking_task(booking_id):
    """Expire one AWAITING_PAYMENT booking whose 15-minute window has passed.

    Idempotent: if the booking is already CONFIRMED/EXPIRED (e.g. payment won
    the race) the task is a no-op, so a delayed/duplicated run is safe.

    Lock ordering: we lock the Booking row FIRST, then let
    release_inventory_for_booking() lock child inventory rows. verify_slip()
    (payments) has been aligned to lock the booking first too, so the two
    writers can never deadlock (C3 §6.2 lock-ordering agreement).
    """
    with transaction.atomic():
        booking = (
            Booking.objects.select_for_update()
            .filter(pk=booking_id)
            .first()
        )
        if booking is None:
            logger.warning("expire_booking_task: booking %s not found", booking_id)
            return

        if booking.status != BookingStatus.AWAITING_PAYMENT:
            # Already confirmed / cancelled / expired -> nothing to roll back.
            return

        if booking.expires_at and booking.expires_at > timezone.now():
            # Task ran early (clock skew / manual trigger). Refuse to expire.
            return

        release_inventory_for_booking(booking)
        booking.status = BookingStatus.PAYMENT_EXPIRED
        booking.save(update_fields=["status", "updated_at"])

        # Keep the payment in lock-step with its booking (one-to-one).
        payment = Payment.objects.select_for_update().filter(
            booking_id=booking.id, status=PaymentStatus.PENDING
        ).first()
        if payment is not None:
            payment.status = PaymentStatus.EXPIRED
            payment.save(update_fields=["status", "updated_at"])

    logger.info("Expired booking %s (%s)", booking.booking_code, booking_id)
