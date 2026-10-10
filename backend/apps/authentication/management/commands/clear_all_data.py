"""
clear_all_data.py - Management command to clear all test/seed data from database.

Usage:
  python manage.py clear_all_data
  python manage.py clear_all_data --keep-superusers
  python manage.py clear_all_data --all-users
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accommodations.models import Accommodation, Room, RoomImage, RoomPricingCalendar
from apps.authentication.models import MerchantProfile, User, UserRoles
from apps.bookings.models import Booking, BookingItem
from apps.community.models import Coupon, EditorialEntry, LocationEvent, MapLocation, PassportStamp, UserPoints
from apps.otop.models import OTOPProduct
from apps.payments.models import Payment
from apps.services.models import FoodMenu, WellnessService, WellnessTimeSlot


class Command(BaseCommand):
    help = "Clear all catalog, bookings, payments, logs, content, and merchant test data from database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-superusers",
            action="store_true",
            default=True,
            help="Keep Super Admin users (e.g. promlikit@sskru.ac.th) and delete only test users.",
        )
        parser.add_argument(
            "--all-users",
            action="store_true",
            default=False,
            help="Delete ALL users including superusers.",
        )

    def handle(self, *args, **options):
        keep_superusers = not options["all_users"]

        self.stdout.write(self.style.WARNING("Starting database cleanup..."))

        with transaction.atomic():
            # 1. Clear Bookings & Payments
            p_count, _ = Payment.objects.all().delete()
            bi_count, _ = BookingItem.objects.all().delete()
            b_count, _ = Booking.objects.all().delete()
            self.stdout.write(f"  - Deleted {b_count} bookings, {bi_count} items, {p_count} payments")

            # 2. Clear Catalog items
            rpc_count, _ = RoomPricingCalendar.objects.all().delete()
            ri_count, _ = RoomImage.objects.all().delete()
            r_count, _ = Room.objects.all().delete()
            acc_count, _ = Accommodation.objects.all().delete()
            self.stdout.write(f"  - Deleted {acc_count} accommodations, {r_count} rooms")

            wts_count, _ = WellnessTimeSlot.objects.all().delete()
            ws_count, _ = WellnessService.objects.all().delete()
            food_count, _ = FoodMenu.objects.all().delete()
            otop_count, _ = OTOPProduct.objects.all().delete()
            self.stdout.write(f"  - Deleted {ws_count} wellness services, {food_count} food items, {otop_count} OTOP products")

            # 3. Clear Community & Editorial content
            ps_count, _ = PassportStamp.objects.all().delete()
            ml_count, _ = MapLocation.objects.all().delete()
            up_count, _ = UserPoints.objects.all().delete()
            c_count, _ = Coupon.objects.all().delete()
            loc_count, _ = LocationEvent.objects.all().delete()
            content_count, _ = EditorialEntry.objects.all().delete()
            self.stdout.write(f"  - Deleted {content_count} content stories, {loc_count} location events, {ml_count} map locations")

            # 4. Clear Merchant profiles & Users
            mp_count, _ = MerchantProfile.objects.all().delete()
            
            if keep_superusers:
                users_to_delete = User.objects.exclude(
                    role=UserRoles.SUPER_ADMIN
                ).exclude(is_superuser=True)
                u_count, _ = users_to_delete.delete()
                self.stdout.write(f"  - Deleted {mp_count} merchant profiles and {u_count} non-superuser accounts (Super Admins preserved)")
            else:
                u_count, _ = User.objects.all().delete()
                self.stdout.write(f"  - Deleted {mp_count} merchant profiles and ALL {u_count} user accounts")

        self.stdout.write(self.style.SUCCESS("✓ Database cleanup finished successfully! All test data removed."))
