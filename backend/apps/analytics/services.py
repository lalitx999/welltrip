"""Analytics aggregation & report export service."""
import csv
import io
from django.db.models import Count, Sum
from django.utils import timezone

from apps.accommodations.models import Accommodation
from apps.bookings.models import Booking, BookingItem
from apps.otop.models import OTOPProduct
from apps.payments.models import Payment


def get_community_analytics_data() -> dict:
    """Aggregate community-level sales, occupancy rates & tourist demographics."""
    total_gmv = (
        Payment.objects.filter(status="SUCCESS").aggregate(total=Sum("amount"))["total"]
        or 0
    )
    total_bookings = Booking.objects.count()
    completed_bookings = Booking.objects.filter(status="COMPLETED").count()

    total_accommodations = Accommodation.objects.count()
    occupancy_rate = None  # No reporting window/inventory denominator has been configured.

    # Paid order snapshots supply actual sales, even if a catalog row changes later.
    top_otop = list(
        BookingItem.objects.filter(item_type="OTOP_GOODS", booking__payment__status="SUCCESS")
        .values("entity_id", "item_title_snapshot")
        .annotate(total_sales=Sum("quantity"), sales_amount=Sum("total_price"))
        .order_by("-total_sales")[:5]
    )
    # No provenance-backed demographic field exists; do not fabricate visitor origins.
    tourist_provinces = []

    return {
        "generated_at": timezone.now().isoformat(),
        "summary": {
            "total_gmv": float(total_gmv),
            "total_bookings": total_bookings,
            "completed_bookings": completed_bookings,
            "total_accommodations": total_accommodations,
            "occupancy_rate_percent": occupancy_rate,
        },
        "top_otop_products": top_otop,
        "tourist_provinces": tourist_provinces,
    }


def generate_analytics_csv_report() -> str:
    """Generate a clean CSV report string for community admins."""
    data = get_community_analytics_data()
    output = io.StringIO()
    writer = csv.writer(output)

    # Title & Header
    writer.writerow(["WellTrip Community Analytics Report"])
    writer.writerow(["Generated At", data["generated_at"]])
    writer.writerow([])

    # Executive Summary Table
    writer.writerow(["Metric Name", "Value"])
    writer.writerow(["Total Revenue (GMV)", f"{data['summary']['total_gmv']:,.2f} THB"])
    writer.writerow(["Total Bookings", data["summary"]["total_bookings"]])
    writer.writerow(["Completed Bookings", data["summary"]["completed_bookings"]])
    writer.writerow(["Occupancy Rate", "Not available"])
    writer.writerow([])

    # Demographic Table
    writer.writerow(["Province", "Visitor Count", "Percentage (%)"])
    for prov in data["tourist_provinces"]:
        writer.writerow([prov["province"], prov["count"], f"{prov['percentage']:.1f}%"])

    return output.getvalue()
