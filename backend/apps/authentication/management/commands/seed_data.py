"""Management command to populate WellTrip Eco-Wellness Seed Data and User Accounts."""
import os
from datetime import date, timedelta, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accommodations.models import Accommodation, AccommodationStatus, Room, RoomPricingCalendar
from apps.authentication.models import User, UserRoles
from apps.otop.models import OTOPCategory, OTOPProduct
from apps.services.models import FoodMenu, FoodWellnessCategory, WellnessService, WellnessTimeSlot


class Command(BaseCommand):
    help = "Seeds initial database with users (all 7 roles) and realistic Eco-Wellness data."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting WellTrip Eco-Wellness data seeding..."))

        with transaction.atomic():
            users = self.seed_users()
            self.seed_accommodations(users["homestay"])
            self.seed_foods(users["restaurant"])
            self.seed_wellness(users["wellness"])
            self.seed_otop(users["otop"])

        self.stdout.write(self.style.SUCCESS("Successfully seeded all WellTrip data!"))

    def seed_users(self):
        self.stdout.write("  Creating user accounts for 7 roles...")
        user_specs = [
            ("admin@welltrip.com", "admin1234", UserRoles.SUPER_ADMIN, True, True, "Admin", "Super"),
            ("community@welltrip.com", "community1234", UserRoles.COMMUNITY_ADMIN, True, False, "Community", "Admin"),
            ("homestay@welltrip.com", "homestay1234", UserRoles.HOMESTAY_OWNER, True, False, "เจ้าของ", "โฮมสเตย์ล้านนา"),
            ("restaurant@welltrip.com", "restaurant1234", UserRoles.RESTAURANT_OWNER, True, False, "เชฟ", "ครัวออร์แกนิค"),
            ("wellness@welltrip.com", "wellness1234", UserRoles.WELLNESS_OWNER, True, False, "มาสเตอร์", "สปาสมุนไพร"),
            ("otop@welltrip.com", "otop1234", UserRoles.OTOP_OWNER, True, False, "ป้อก้า", "OTOP แม่แจ่ม"),
            ("tourist@welltrip.com", "tourist1234", UserRoles.TOURIST, False, False, "นักท่องเที่ยว", "คนเมือง"),
        ]

        created_users = {}
        for email, password, role, is_staff, is_superuser, first_name, last_name in user_specs:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "role": role,
                    "is_staff": is_staff,
                    "is_superuser": is_superuser,
                    "is_verified": True,
                    "is_active": True,
                },
            )
            user.set_password(password)
            user.role = role
            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.is_verified = True
            user.first_name = first_name
            user.last_name = last_name
            user.save()

            role_key = role.lower().replace("_owner", "").replace("_admin", "")
            created_users[role_key] = user
            status_str = "Created" if created else "Updated"
            self.stdout.write(f"    - {status_str} account: {email} ({role})")

        return created_users

    def seed_accommodations(self, owner):
        self.stdout.write("  Creating Accommodations & Rooms...")
        acc1, _ = Accommodation.objects.get_or_create(
            name="เรือนล้านนา สังคโลก เฮลท์ รีสอร์ท (Lanna Sangkhalok Eco Resort)",
            defaults={
                "owner": owner,
                "description": "รีสอร์ทเพื่อสุขภาพสไตล์ล้านนา ท่ามกลางธรรมชาติและแปลงผักออร์แกนิค สัมผัสวิถีชีวิตสโลว์ไลฟ์",
                "address": "123 หมู่ 4 ต.เมืองเก่า",
                "subdistrict": "เมืองเก่า",
                "district": "เมืองสุโขทัย",
                "province": "สุโขทัย",
                "postal_code": "64210",
                "status": AccommodationStatus.ACTIVE,
            },
        )

        r1, _ = Room.objects.get_or_create(
            accommodation=acc1,
            name="Deluxe Garden View Lanna Room",
            defaults={
                "description": "ห้องพักเรือนไม้สไตล์ล้านนา มองเห็นวิวสวนสมุนไพรและแปลงผักเกษตรอินทรีย์",
                "base_capacity": 2,
                "max_capacity": 3,
                "base_price_per_night": Decimal("2200.00"),
                "total_inventory": 3,
                "amenities": {"wifi": True, "aircon": True, "breakfast": True, "herbal_tea": True},
                "is_active": True,
            },
        )

        r2, _ = Room.objects.get_or_create(
            accommodation=acc1,
            name="Executive Suite Rice Field View",
            defaults={
                "description": "สวีตเรือนไทลื้อ วิวทุ่งนาแบบพานอรามา พร้อมอ่างแช่น้ำต้มสมุนไพรส่วนตัว",
                "base_capacity": 2,
                "max_capacity": 4,
                "base_price_per_night": Decimal("3800.00"),
                "total_inventory": 2,
                "amenities": {"wifi": True, "aircon": True, "bathtub": True, "organic_minibar": True},
                "is_active": True,
            },
        )

        acc2, _ = Accommodation.objects.get_or_create(
            name="บ้านสวนสมุนไพร แม่ริม (Mae Rim Herbal Sanctuary)",
            defaults={
                "owner": owner,
                "description": "โฮมสเตย์เชิงนิเวศ อากาศบริสุทธิ์ติดแม่น้ำและป่าสนธรรมชาติ อำเภอแม่ริม",
                "address": "45/1 หมู่ 2 ต.แม่แรม",
                "subdistrict": "แม่แรม",
                "district": "แม่ริม",
                "province": "เชียงใหม่",
                "postal_code": "50180",
                "status": AccommodationStatus.ACTIVE,
            },
        )

        r3, _ = Room.objects.get_or_create(
            accommodation=acc2,
            name="Herbal Sanctuary Wooden Cabin",
            defaults={
                "description": "กระท่อมไม้สนอบอุ่น ริมธารน้ำตก พร้อมชุดชาสมุนไพรต้อนรับต้มสด",
                "base_capacity": 2,
                "max_capacity": 2,
                "base_price_per_night": Decimal("2600.00"),
                "total_inventory": 4,
                "amenities": {"wifi": True, "mountain_view": True, "fireplace": True},
                "is_active": True,
            },
        )

        # Seed 30-day availability for rooms
        today = date.today()
        for room in [r1, r2, r3]:
            for d in range(30):
                current_date = today + timedelta(days=d)
                RoomPricingCalendar.objects.get_or_create(
                    room=room,
                    date=current_date,
                    defaults={"available_count": room.total_inventory},
                )

    def seed_foods(self, owner):
        self.stdout.write("  Creating Food Menus...")
        foods = [
            ("แกงแคไก่บ้านสมุนไพรสูตรโบราณ", "แกงพื้นเมืองล้านนา รวมสมุนไพรผักพื้นบ้านกว่า 10 ชนิด ช่วยบำรุงธาตุ", Decimal("180.00"), FoodWellnessCategory.HERBAL, 320),
            ("สลัดผักออร์แกนิคซอสเซซามิ", "ผักสลัดสดจากแปลงเกษตรอินทรีย์ เสิร์ฟพร้อมงาดำคั่วหอมสดชื่น", Decimal("140.00"), FoodWellnessCategory.ORGANIC, 180),
            ("ข้าวซอยไก่ออร์แกนิคสูตรคลีน", "ข้าวซอยเส้นโฮมเมด กะทิต้มสดไขมันต่ำ รสชาติกลมกล่อมสูตรโซเดียมต่ำ", Decimal("160.00"), FoodWellnessCategory.LOW_SODIUM, 380),
            ("น้ำสมุนไพรดอกอัญชันใบเตยหวานน้อย", "เครื่องดื่มสมุนไพรต้มสด ชะลอวัย หวานน้อยด้วยน้ำตาลมะพร้าวธรรมชาติ", Decimal("65.00"), FoodWellnessCategory.LOW_SUGAR, 45),
            ("ผัดไทยสมุนไพรไร้น้ำมัน", "ผัดไทยเส้นจันทน์ใช้น้ำซุปสมุนไพรรังสรรค์แทนน้ำมัน อุดมไปด้วยโปรตีนถั่วเหลือง", Decimal("150.00"), FoodWellnessCategory.VEGAN, 290),
        ]

        for name, desc, price, cat, cal in foods:
            FoodMenu.objects.get_or_create(
                owner=owner,
                name=name,
                defaults={
                    "description": desc,
                    "price": price,
                    "wellness_category": cat,
                    "calorie_estimate": cal,
                    "is_available": True,
                },
            )

    def seed_wellness(self, owner):
        self.stdout.write("  Creating Wellness & Spa Services...")
        services = [
            ("นวดแผนไทยสมุนไพรล้านนา 90 นาที", "นวดกดจุดคลายเส้นประสาท ผสานลูกประคบสมุนไพรสดสูตรล้านนาโบราณ", Decimal("850.00"), 90, 4),
            ("สปาประคบสมุนไพรผ่อนคลายความเครียด", "ทรีตเมนต์ผ่อนคลายกล้ามเนื้อคอ บ่า ไหล่ ด้วยไพล มะกรูด ขมิ้นชัน", Decimal("1200.00"), 120, 2),
            ("แช่น้ำแร่ออนเซ็นสมุนไพรต้มสด", "บ่อน้ำแร่ธรรมชาติผสมสมุนไพรบำรุงผิวพรรณ และกระตุ้นระบบการไหลเวียนเลือด", Decimal("600.00"), 60, 6),
        ]

        today = date.today()
        times = [time(9, 0), time(11, 0), time(14, 0), time(16, 0)]

        for title, desc, price, duration, cap in services:
            svc, _ = WellnessService.objects.get_or_create(
                owner=owner,
                title=title,
                defaults={
                    "description": desc,
                    "price": price,
                    "duration_minutes": duration,
                    "max_capacity_per_session": cap,
                    "is_active": True,
                },
            )

            # Seed time slots for 7 days
            for day_idx in range(7):
                slot_date = today + timedelta(days=day_idx)
                for t in times:
                    end_h = t.hour + (duration // 60)
                    end_m = t.minute + (duration % 60)
                    if end_m >= 60:
                        end_h += 1
                        end_m -= 60
                    end_t = time(end_h, end_m)

                    WellnessTimeSlot.objects.get_or_create(
                        service=svc,
                        slot_date=slot_date,
                        start_time=t,
                        defaults={
                            "end_time": end_t,
                            "capacity_available": cap,
                        },
                    )

    def seed_otop(self, owner):
        self.stdout.write("  Creating OTOP Products...")
        products = [
            ("ผ้าทอมือลายโบราณแม่แจ่ม (Handwoven Lanna Textile)", "ผ้าทอมือเอกลักษณ์อำเภอแม่แจ่ม ย้อมสีธรรมชาติจากเปลือกไม้และคราม", Decimal("1850.00"), OTOPCategory.TEXTILE, 15),
            ("ชาสมุนไพรออร์แกนิคเชียงใหม่ (Chiang Mai Herbal Tea)", "ชาใบเตยผสมอัญชันและตะไคร้ตากแห้ง ปลูกแบบเกษตรอินทรีย์บนดอยสูง", Decimal("290.00"), OTOPCategory.HERBAL_PRODUCT, 50),
            ("สบู่สมุนไพรขมิ้นชันธรรมชาติ (Turmeric Herbal Soap)", "สบู่ทำมือจากขมิ้นชันและน้ำมันมะพร้าวบริสุทธิ์ ช่วยลดการอักเสบผิว", Decimal("120.00"), OTOPCategory.HERBAL_PRODUCT, 100),
            ("น้ำผึ้งป่าเดือนห้าเกษตรอินทรีย์ (Wild Organic Honey)", "น้ำผึ้งป่าบริสุทธิ์ 100% จากเกสรดอกไม้ป่าธรรมชาติ เก็บในฤดูดีที่สุด", Decimal("450.00"), OTOPCategory.PROCESSED_FOOD, 30),
            ("เครื่องสานไผ่ล้านนาประณีต (Lanna Bamboo Craft)", "ตะกร้าไผ่สานโฮมเมดประณีต โดยกลุ่มวิสาหกิจชุมชนภูมิปัญญาชาวบ้าน", Decimal("680.00"), OTOPCategory.CRAFT, 20),
        ]

        for name, desc, price, cat, stock in products:
            OTOPProduct.objects.get_or_create(
                owner=owner,
                name=name,
                defaults={
                    "description": desc,
                    "price": price,
                    "category": cat,
                    "stock_quantity": stock,
                    "is_active": True,
                },
            )
