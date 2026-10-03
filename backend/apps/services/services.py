"""
Wellness domain business logic (spec §2.3 + Phase-1 Step-2 list).

Design decisions (WHY):
1. A WellnessTimeSlot row is the inventory truth for ONE concrete session
   (service + date + start_time). Its capacity_available is decremented the
   moment a checkout creates a Booking and restored when that booking's
   payment expires (handled by the bookings slice / Step-4 worker) - so the
   "how many seats are left" answer never has to scan Booking rows.
2. A slot is created manually by the vendor: date + start_time + end_time +
   capacity. capacity defaults to the service.max_capacity_per_session and can
   never exceed it - a session must not sell more seats than the service was
   defined to hold.
3. Overlapping sessions of the same service on the same date are rejected:
   there is no staff/resource model yet, so two overlapping slots of one
   service would silently double-book the same provider. Contiguous slots
   (10:00-11:00 followed by 11:00-12:00) are allowed and do not overlap.
4. The DB UniqueConstraint (service, slot_date, start_time) stays the final
   backstop against duplicate start times; this module raises friendly,
   explicit errors before the database would.
"""
from datetime import date, time

from .models import WellnessService, WellnessTimeSlot


def get_wellness_slots(service_id, slot_date):
    """Return every slot of a service on the given date, ordered by time.

    Used by the public endpoint GET /wellness/{id}/slots/?date=YYYY-MM-DD and
    later by checkout verification. Raises ValueError when the service does
    not exist or is not active so a view can map it to a "not found"
    response, and TypeError for a non-date argument.
    """
    if type(slot_date) is not date:
        raise TypeError("slot_date must be a datetime.date object.")

    service = WellnessService.objects.filter(pk=service_id, is_active=True).first()
    if service is None:
        raise ValueError("Wellness service not found or inactive.")

    return list(
        WellnessTimeSlot.objects.filter(
            service_id=service_id, slot_date=slot_date
        ).order_by("start_time")
    )


def create_wellness_time_slot(
    service_id, slot_date, start_time, end_time, capacity=None
):
    """Create ONE manual time slot (spec POST /wellness/{id}/slots/).

    Validation order is deliberate so the caller always gets the most
    actionable error first:
      1. argument types (date / time objects),
      2. end_time must be after start_time,
      3. service must exist and be active,
      4. capacity between 1 and the service max_capacity_per_session,
      5. no overlapping slot on the same service + date.

    Returns the created WellnessTimeSlot.
    """
    if type(slot_date) is not date:
        raise TypeError("slot_date must be a datetime.date object.")
    if type(start_time) is not time or type(end_time) is not time:
        raise TypeError("start_time and end_time must be datetime.time objects.")
    if end_time <= start_time:
        raise ValueError("end_time must be after start_time.")

    service = WellnessService.objects.filter(pk=service_id, is_active=True).first()
    if service is None:
        raise ValueError("Wellness service not found or inactive.")

    if capacity is None:
        capacity = service.max_capacity_per_session
    if not isinstance(capacity, int) or isinstance(capacity, bool):
        raise TypeError("capacity must be an integer.")
    if capacity < 1 or capacity > service.max_capacity_per_session:
        raise ValueError(
            "capacity must be between 1 and max_capacity_per_session "
            f"({service.max_capacity_per_session})."
        )

    # Overlap means: an existing slot starts before ours ends AND ends after
    # ours starts. Equal boundaries (back-to-back slots) do NOT overlap.
    overlaps = WellnessTimeSlot.objects.filter(
        service_id=service_id,
        slot_date=slot_date,
        start_time__lt=end_time,
        end_time__gt=start_time,
    )
    if overlaps.exists():
        raise ValueError(
            "A slot on this date already overlaps the requested time range."
        )

    return WellnessTimeSlot.objects.create(
        service=service,
        slot_date=slot_date,
        start_time=start_time,
        end_time=end_time,
        capacity_available=capacity,
    )
