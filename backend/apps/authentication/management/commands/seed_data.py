"""Management command to populate WellTrip Sisaket Tourism & Eco-Wellness Data and User Accounts."""
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
    help = "Seeds initial database with users (all 7 roles) and 100% authentic Sisaket Eco-Wellness data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing accommodations, foods, wellness services, and OTOP products before seeding.",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting WellTrip Sisaket data seeding..."))

        clear_first = options.get("clear", False)

        with transaction.atomic():
            if clear_first:
                self.stdout.write(self.style.WARNING("  Clearing all existing catalog entities..."))
                RoomPricingCalendar.objects.all().delete()
                Room.objects.all().delete()
                Accommodation.objects.all().delete()
                FoodMenu.objects.all().delete()
                WellnessTimeSlot.objects.all().delete()
                WellnessService.objects.all().delete()
                OTOPProduct.objects.all().delete()
                self.stdout.write(self.style.SUCCESS("  Catalog cleared cleanly!"))

            users = self.seed_users()
            self.seed_accommodations(users["homestay"])
            self.seed_foods(users["restaurant"])
            self.seed_wellness(users["wellness"])
            self.seed_otop(users["otop"])

        self.stdout.write(self.style.SUCCESS("Successfully seeded all 100% Sisaket WellTrip data!"))

    def seed_users(self):
        self.stdout.write("  Creating user accounts for 7 roles...")
        user_specs = [
            ("promlikit@sskru.ac.th", "Promlikit.199", UserRoles.SUPER_ADMIN, True, True, "พรหมลิขิต", "อุรา"),
            ("community@welltrip.com", "community1234", UserRoles.COMMUNITY_ADMIN, True, False, "Community", "Admin"),
            ("homestay@welltrip.com", "homestay1234", UserRoles.HOMESTAY_OWNER, True, False, "เจ้าของ", "โฮมสเตย์ศรีสะเกษ"),
            ("restaurant@welltrip.com", "restaurant1234", UserRoles.RESTAURANT_OWNER, True, False, "เชฟ", "ครัวศรีสะเกษ"),
            ("wellness@welltrip.com", "wellness1234", UserRoles.WELLNESS_OWNER, True, False, "มาสเตอร์", "สปาสมุนไพรศรีสะเกษ"),
            ("otop@welltrip.com", "otop1234", UserRoles.OTOP_OWNER, True, False, "กลุ่ม OTOP", "ศรีสะเกษ"),
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
        self.stdout.write("  Creating 10 Sisaket Accommodations & Rooms...")
        acc_specs = [
            ("เรือนไม้ขุนหาญ โฮมสเตย์สวนทุเรียนภูเขาไฟ", "โฮมสเตย์เรือนไม้บรรยากาศอบอุ่น ล้อมรอบด้วยสวนทุเรียนภูเขาไฟ GI และสวนผลไม้สด", "123 หมู่ 1 ต.พราน", "พราน", "ขุนหาญ", Decimal("950.00")),
            ("เฮือนอีสานโบราณ บ้านละทาย ริมแม่น้ำมูล", "สัมผัสวิถีชีวิตโฮมสเตย์ริมแม่น้ำมูล ชมพระอาทิตย์ตกดิน และร่วมเวิร์กชอปจักสาน", "45 หมู่ 3 ต.ละทาย", "ละทาย", "กันทรารมย์", Decimal("850.00")),
            ("บ้านสวนผลไม้ซำขี้เหล็ก โฮมสเตย์เชิงนิเวศ", "พักผ่อนกลางสวนผลไม้ดินภูเขาไฟ ชิมกาแฟสดโรบัสต้าและผลไม้สดส่งตรงจากต้น", "88 หมู่ 5 ต.พราน", "พราน", "ขุนหาญ", Decimal("1200.00")),
            ("บ้านปราสาทเยอ โฮมสเตย์มรดกขอม", "เรียนรู้วิถีชีวิตชนเผ่าเยอ กราบขอพรหลวงปู่มุม และชมสถาปัตยกรรมขอมโบราณ", "12 หมู่ 2 ต.ปราสาทเยอ", "ปราสาทเยอ", "ไพรบึง", Decimal("800.00")),
            ("เรือนลำดวน สวนสมเด็จพระศรีนครินทร์ รีสอร์ท", "รีสอร์ทเพื่อสุขภาพติดสวนลำดวนธรรมชาติ 40,000 ต้น อากาศบริสุทธิ์ใจกลางเมือง", "99 ถนนราษฎร์บำรุง", "เมืองเหนือ", "เมืองศรีสะเกษ", Decimal("1500.00")),
            ("บ้านหัวนา โฮมสเตย์เกษตรริมแม่น้ำมูล", "โฮมสเตย์วิถีเกษตรกร ชิมหอมแดงอินทรีย์ สักการะพระธาตุกตัญญู และเที่ยวเขื่อนหัวนา", "34 หมู่ 4 ต.หนองหนาม", "หนองหนาม", "ยางชุมน้อย", Decimal("750.00")),
            ("เขตรักษาพันธุ์สัตว์ป่าพนมดงรัก บ้านพักนิเวศ", "บ้านพักตากอากาศใกล้น้ำตกภูลออและผามออีแดง สัมผัสความบริสุทธิ์ของธรรมชาติ", "1 หมู่ 8 ต.เสาธงชัย", "เสาธงชัย", "กันทรลักษ์", Decimal("1100.00")),
            ("บ้านกู่ โฮมสเตย์สระน้ำโบราณบาราย", "พักผ่อนใกล้ปราสาทศิลาแลงปรางค์กู่ เรียนรู้การทอผ้าลายโบราณและทำขนมไปรแมะ", "56 หมู่ 1 ต.กู่", "กู่", "ปรางค์กู่", Decimal("900.00")),
            ("ภูสิงห์วิวชายแดน โฮมสเตย์หลวงปู่สรวง", "โฮมสเตย์ใกล้ผาพญากูปรีและวัดไพรพัฒนา สัมผัสอากาศเย็นสบายตลอดปี", "77 หมู่ 6 ต.ไพรพัฒนา", "ไพรพัฒนา", "ภูสิงห์", Decimal("1000.00")),
            ("บ้านสร้างเรือง โฮมสเตย์มรดก 4 ชนเผ่า", "โฮมสเตย์ใกล้พิพิธภัณฑ์วัฒนธรรม 4 ชนเผ่าศรีสะเกษ และวัดพระธาตุเรืองรอง", "23 หมู่ 2 ต.หญ้าปล้อง", "หญ้าปล้อง", "เมืองศรีสะเกษ", Decimal("850.00")),
        ]

        today = date.today()
        for name, desc, addr, subdist, dist, price in acc_specs:
            acc, _ = Accommodation.objects.get_or_create(
                name=name,
                defaults={
                    "owner": owner,
                    "description": desc,
                    "address": addr,
                    "subdistrict": subdist,
                    "district": dist,
                    "province": "ศรีสะเกษ",
                    "postal_code": "33000",
                    "status": AccommodationStatus.ACTIVE,
                },
            )

            room, _ = Room.objects.get_or_create(
                accommodation=acc,
                name=f"ห้องพักเรือนไม้เอกลักษณ์ ({name[:15]})",
                defaults={
                    "description": "ห้องพักบรรยากาศธรรมชาติ พร้อมสิ่งอำนวยความสะดวกครบครันและอาหารเช้าพื้นเมือง",
                    "base_capacity": 2,
                    "max_capacity": 4,
                    "base_price_per_night": price,
                    "total_inventory": 3,
                    "amenities": {"wifi": True, "aircon": True, "breakfast": True, "herbal_tea": True},
                    "is_active": True,
                },
            )

            for d in range(30):
                current_date = today + timedelta(days=d)
                RoomPricingCalendar.objects.get_or_create(
                    room=room,
                    date=current_date,
                    defaults={"available_count": room.total_inventory},
                )

    def seed_foods(self, owner):
        self.stdout.write("  Creating 10 Sisaket Local Healthy Foods...")
        foods = [
            ("แกงอ่อมไก่บ้านสมุนไพรพริกสดศรีสะเกษ", "แกงอ่อมรสกลมกล่อม ใส่ไก่บ้านและสมุนไพรผักพื้นบ้านสด อุดมด้วยเบต้าแคโรทีน", Decimal("150.00"), FoodWellnessCategory.HERBAL, 280),
            ("ปลาช่อนแม่น้ำมูลย่างเกลือแจ่วหอมแดง GI", "ปลาช่อนแม่น้ำมูลเนื้อหวานสด ทานคู่แจ่วหอมแดง GI ศรีสะเกษโซเดียมต่ำ", Decimal("220.00"), FoodWellnessCategory.LOW_SODIUM, 310),
            ("ตำซั่วขนมจีนน้ำปลาร้าต้มสุกสูตรโซเดียมต่ำ", "ส้มตำรสแซ่บนัวใช้น้ำปลาร้าต้มสุกปรุงโซเดียมต่ำ แซ่บอร่อยและดีต่อสุขภาพ", Decimal("85.00"), FoodWellnessCategory.LOW_SODIUM, 190),
            ("ซุปหน่อไม้สดใส่ใบย่านางสมุนไพร", "หน่อไม้สดต้มน้ำใบย่านางเข้มข้น ปรุงรสกลมกล่อมด้วยไร้น้ำมัน แคลอรีต่ำ", Decimal("90.00"), FoodWellnessCategory.VEGAN, 120),
            ("น้ำต้มสมุนไพรดอกลำดวนต้มสดหวานน้อย", "เครื่องดื่มอัตลักษณ์ศรีสะเกษ กลิ่นหอมอบอวล ชะลอวัย สดชื่นผ่อนคลาย", Decimal("45.00"), FoodWellnessCategory.LOW_SUGAR, 35),
            ("แกงเห็ดระโงกธรรมชาติผักหวานป่า", "แกงเห็ดระโงกสดจากผืนป่าพนมดงรัก รสชาติกลมกล่อมตามธรรมชาติ ไร้ผงชูรส", Decimal("160.00"), FoodWellnessCategory.ORGANIC, 140),
            ("ยำหัวบัวห้วยน้ำคำสมุนไพรสด", "หัวบัวสดกรอบจากบึงห้วยน้ำคำ คลุกเคล้าเครื่องยำสมุนไพรและถั่วพูอินทรีย์", Decimal("120.00"), FoodWellnessCategory.HERBAL, 160),
            ("ไก่ย่างไม้มะดันห้วยทับทันสูตรดั้งเดิม", "ไก่ย่างไม้มะดันหอมกรอบนอกนุ่มใน โปรตีนสูง เสิร์ฟพร้อมน้ำจิ้มแจ่วรสเด็ด", Decimal("180.00"), FoodWellnessCategory.ORGANIC, 340),
            ("ลาบปลาคังแม่น้ำมูลสมุนไพรพื้นบ้าน", "เนื้อปลาคังสดแลกนึ่งสุก นำมาทำลาบสมุนไพรพริกแห้งคั่วหอม อุดมด้วยโอเมก้า 3", Decimal("190.00"), FoodWellnessCategory.HERBAL, 230),
            ("ชาสมุนไพรหอมแดงสกัดอินทรีย์ศรีสะเกษ", "ชาสมุนไพรสูตรพิเศษสกัดจากหอมแดง GI และใบเตย ชะลอวัยและบำรุงหัวใจ", Decimal("55.00"), FoodWellnessCategory.LOW_SUGAR, 25),
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
        self.stdout.write("  Creating 10 Sisaket Wellness & Spa Services...")
        services = [
            ("นวดแผนไทยสมุนไพรไพลสดศรีสะเกษ 90 นาที", "นวดกดจุดคลายเส้นประสาท ผสานลูกประคบไพลสดและไพลสกัดสูตรศรีสะเกษโบราณ", Decimal("650.00"), 90, 4),
            ("สปาประคบลูกประคบสมุนไพรพื้นบ้าน 120 นาที", "ทรีตเมนต์ผ่อนคลายกล้ามเนื้อคอ บ่า ไหล่ ด้วยไพล มะกรูด ขมิ้นชัน และหอมแดง", Decimal("950.00"), 120, 2),
            ("อบไอน้ำสมุนไพรสด 4 ชนเผ่าคลายเส้น 60 นาที", "ตู้อบไอน้ำสมุนไพรต้มสด ขับสารพิษ กระตุ้นการไหลเวียนโลหิตและผ่อนคลายจิตใจ", Decimal("450.00"), 60, 6),
            ("นวดกดจุดสะท้อนเท้าสมุนไพรอินทรีย์ 60 นาที", "นวดเท้าคลายความเหนื่อยล้าด้วยน้ำมันสมุนไพรอินทรีย์ คลายกล้ามเนื้อขา", Decimal("400.00"), 60, 4),
            ("สปาขัดผิวด้วยกาแฟดินภูเขาไฟ GI 90 นาที", "สครับขัดผิวเซลล์เสื่อมสภาพด้วยกาแฟโรบัสต้าดินภูเขาไฟ GI ขุนหาญ ผิวนุ่มใส", Decimal("1200.00"), 90, 2),
            ("แช่บ่อน้ำสมุนไพรต้มสดบำรุงผิวพรรณ 60 นาที", "แช่น้ำอุ่นผสมสมุนไพรสดบำรุงผิว ลดอาการปวดเมื่อยหลังจากการเดินทาง", Decimal("500.00"), 60, 4),
            ("โยคะสมาธิรับอรุณริมบึงห้วยน้ำคำ 60 นาที", "คลาสโยคะและฝึกสมาธิรับลมเช้าตรู้ริมบึงห้วยน้ำคำ เติมพลังบวกและความสงบ", Decimal("300.00"), 60, 10),
            ("นวดอโรมาน้ำมันมะพร้าวบริสุทธิ์ขุนหาญ 90 นาที", "นวดผ่อนคลายด้วยน้ำมันมะพร้าวบริสุทธิ์สกัดเย็น ช่วยให้ผิวชุ่มชื้นและนอนหลับสบาย", Decimal("850.00"), 90, 3),
            ("ทรีตเมนต์พอกหน้าด้วยขมิ้นชันธรรมชาติ 45 นาที", "มาร์กพอกผิวหน้าด้วยขมิ้นชันอินทรีย์และน้ำผึ้งป่า ลดการอักเสบและกระจ่างใส", Decimal("350.00"), 45, 2),
            ("สปาผ่อนคลายคอบ่าไหล่ Office Syndrome 60 นาที", "นวดเน้นจุดตึงสะสมบริเวณคอบ่าไหล่ด้วยน้ำยาไพลสกัดเย็น คลายปวดทันใจ", Decimal("500.00"), 60, 4),
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
        self.stdout.write("  Creating 10 Sisaket OTOP Products...")
        products = [
            ("เสื้อยืดอัตลักษณ์ศรีสะเกษ (Sound of Sisaket T-Shirt)", "เสื้อยืดคอตตอน 100% ลายสัญลักษณ์ ศรีสะเกษ เมืองแห่งโอกาส และ Sound of Sisaket 2026 เนื้อผ้านุ่มระบายอากาศดี มีสีขาวและสีเขียวพรีเมียม", Decimal("290.00"), OTOPCategory.TEXTILE, 100),
            ("กาแฟโรบัสต้าขุนหาญ ดินภูเขาไฟ GI (500 กรัม)", "เมล็ดกาแฟโรบัสต้าแท้ 100% ปลูกบนพื้นที่ดินภูเขาไฟ GI อำเภอขุนหาญ จังหวัดศรีสะเกษ ขนาดบรรจุ 500 กรัม หอมเข้มกลมกล่อม", Decimal("250.00"), OTOPCategory.PROCESSED_FOOD, 100),
            ("ผ้าทอมือลายโบราณชนเผ่าเยอ (Handwoven Yoe Textile)", "ผ้าทอมือเอกลักษณ์ชนเผ่าเยอ อำเภอไพรบึง ย้อมสีธรรมชาติจากเปลือกไม้และครามโบราณ", Decimal("1450.00"), OTOPCategory.TEXTILE, 25),
            ("หอมแดงศรีสะเกษ GI เกรดพรีเมียม (1 กิโลกรัม)", "หอมแดง GI ศรีสะเกษ แท้ 100% กลิ่นหอมฉุน เปลือกแห้งสีแดงม่วง หัวแน่น เก็บได้นาน", Decimal("120.00"), OTOPCategory.PROCESSED_FOOD, 200),
            ("กระเทียมโทนอินทรีย์ศรีสะเกษ GI (500 กรัม)", "กระเทียมโทนสกัดอินทรีย์ รสชาติเผ็ดร้อน หัวแน่น อุดมด้วยสารอัลลิซินบำรุงสุขภาพ", Decimal("160.00"), OTOPCategory.PROCESSED_FOOD, 150),
            ("กระเป๋าจักสานหวายและไม้ไผ่บ้านละทาย", "กระเป๋าจักสานมือประณีตโดยกลุ่มแม่บ้านบ้านละทาย แข็งแรงทนทาน ทรงสวยงาม", Decimal("480.00"), OTOPCategory.CRAFT, 40),
            ("สบู่สมุนไพรขมิ้นชันผสมน้ำผึ้งป่า", "สบู่ทำมือจากขมิ้นชันอินทรีย์และน้ำผึ้งป่าเทือกเขาพนมดงรัก ทำความสะอาดอ่อนโยน", Decimal("85.00"), OTOPCategory.HERBAL_PRODUCT, 150),
            ("น้ำผึ้งป่าธรรมชาติเทือกเขาพนมดงรัก (500 ml)", "น้ำผึ้งป่าแท้ 100% จากเกสรดอกไม้ป่าธรรมชาติ เก็บในฤดูเดือนห้า รสชาติหวานหอม", Decimal("390.00"), OTOPCategory.PROCESSED_FOOD, 60),
            ("เสื่อกกสานมือลายโบราณบ้านกู่", "เสื่อกกทอมือธรรมชาติ นุ่มเย็น ทนทาน ทอลายโบราณจากภูมิปัญญาชาวบ้านบ้านกู่", Decimal("550.00"), OTOPCategory.CRAFT, 30),
            ("ชาสมุนไพรใบเตยผสมอัญชันอินทรีย์ศรีสะเกษ", "ชาสมุนไพรตากแห้ง ปลูกแบบเกษตรอินทรีย์ ปราศจากสารเคมี หวานหอมสดชื่น", Decimal("150.00"), OTOPCategory.HERBAL_PRODUCT, 80),
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
