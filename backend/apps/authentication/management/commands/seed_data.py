"""Management command to populate WellTrip Sisaket Tourism & Eco-Wellness Data and User Accounts."""
import os
from datetime import date, timedelta, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accommodations.models import Accommodation, AccommodationStatus, Room, RoomPricingCalendar
from apps.authentication.models import User, UserRoles
from apps.community.models import EditorialEntry
from apps.otop.models import OTOPCategory, OTOPProduct
from apps.services.models import FoodMenu, FoodWellnessCategory, WellnessService, WellnessTimeSlot


class Command(BaseCommand):
    help = "Seeds initial database with users (all 7 roles) and 100% authentic Sisaket Eco-Wellness data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing accommodations, foods, wellness services, OTOP products, and editorial content before seeding.",
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
                EditorialEntry.objects.all().delete()
                self.stdout.write(self.style.SUCCESS("  Catalog cleared cleanly!"))

            users = self.seed_users()
            self.seed_accommodations(users["homestay"])
            self.seed_foods(users["restaurant"])
            self.seed_wellness(users["wellness"])
            self.seed_otop(users["otop"])
            self.seed_editorial()

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
            ("โกโก้คราฟท์พรีเมียม (COCOA CrafT Signature)", "โกโก้คราฟท์เมล็ดแอฟริกาพรีเมียมเข้มข้นหวานน้อย เสิร์ฟสดจากฟู้ดทรักศรีสะเกษ (โทร 0935645996)", Decimal("65.00"), FoodWellnessCategory.LOW_SUGAR, 120),
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
            ("นวดอโรมาน้ำมันมะพร้าวบริสุทธิ์ขุนหาญ 90 นาที", "นวดผ่อนคลายด้วยน้ำมันมะพร้าวบริสุทธิ์สกัดเย็น ช่วยให้ผิวชุ่มชื้นและนอนหลับสบาย", Decimal("85.00"), 90, 3),
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
        self.stdout.write("  Creating Sisaket OTOP Products...")
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
            ("น้ำโกโก้คราฟท์และชาไทยบรรจุขวด (COCOA CrafT Bottle)", "น้ำชงสด โกโก้คราฟท์/ชาไทย/มัทฉะ บรรจุขวดพรีเมียมจาก COCOA CrafT สำหรับจัดเลี้ยง โรงทาน หรืออีเวนต์", Decimal("35.00"), OTOPCategory.PROCESSED_FOOD, 200),
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

    def seed_editorial(self):
        self.stdout.write("  Creating Sisaket Calendar Events & Community Stories...")
        stories = [
            {
                "kind": EditorialEntry.Kind.STORY,
                "title": "ปฏิทินกิจกรรมศรีสะเกษ Sisaket Resonance (พฤศจิกายน – ธันวาคม 2569)",
                "title_en": "Sisaket Resonance Event Calendar (Nov - Dec 2026)",
                "summary": "ปลายปีนี้ ศรีสะเกษมีอะไรให้ไปเพียบ! จัดเต็มทั้งดนตรี กาแฟ กีฬา การประกวด แคมป์ งานงิ้ว ไทบ้านแลนด์ และ Sound of Sisaket 2026 ณ ศรีสะเกษ เมืองแห่งโอกาส",
                "summary_en": "Packed year-end event schedule in Sisaket! Music, coffee, sports, contests, camping, Chinese opera, Thibaan Land and Sound of Sisaket 2026.",
                "body": (
                    "ปลายปีนี้ ศรีสะเกษมีอะไรให้ไปเพียบ!\n"
                    "ใครกำลังหากิจกรรมไว้เช็กอิน เตรียมปฏิทินให้พร้อมเลย!\n\n"
                    "พฤศจิกายน–ธันวาคมนี้ จัดเต็มทั้ง ดนตรี กาแฟ กีฬา การประกวด แคมป์ งานงิ้ว ไทบ้านแลนด์ และเทศกาลสุดสนุก\n\n"
                    "📌 ปฏิทินกิจกรรม Sisaket Resonance 2569:\n"
                    "• 6–7 พ.ย.: การประกวดวงดนตรีพื้นบ้านโปงลาง 'ศรีศิลป์' (สวนเฉลิมพระเกียรติฯ เกาะห้วยน้ำคำ)\n"
                    "• 13–15 พ.ย.: เทศกาลกาแฟและดนตรี ครั้งที่ 4 (ลานหลังศรีสะเกษอะควาเรียม • เกาะห้วยน้ำคำ)\n"
                    "• 14–17 พ.ย.: ฟุตบอลคิงส์คัพ ครั้งที่ 52 (สนามกีฬากลางจังหวัดศรีสะเกษ)\n"
                    "• 18–22 พ.ย.: งานฉลองเมือง 244 ปี ศรีสะเกษ (สวนเฉลิมพระเกียรติฯ เกาะห้วยน้ำคำ)\n"
                    "• 21–22 พ.ย.: การประกวดวงดนตรีลูกทุ่งแห่งประเทศไทย ชิงถ้วยพระราชทานฯ (สวนเฉลิมพระเกียรติฯ เกาะห้วยน้ำคำ)\n"
                    "• 23–24 พ.ย.: ลอยกระทง (สวนเฉลิมพระเกียรติฯ เกาะห้วยน้ำคำ)\n"
                    "• 25 พ.ย. – 2 ธ.ค.: งานงิ้วประจำปี 2569 (ศาลเจ้าปู่ตาศรีสะเกษ)\n"
                    "• 12–13 ธ.ค. & 19–20 ธ.ค.: CAMP กลางเกาะ (ลานหลังศรีสะเกษอะควาเรียม • เกาะห้วยน้ำคำ)\n"
                    "• 16–19 ธ.ค.: การประกวดวงโยธวาทิตโลก ชิงถ้วยพระราชทานฯ แห่งประเทศไทย\n"
                    "• 16–20 ธ.ค.: Sound of Sisaket 2026 (เทศกาลดนตรีและศิลปะศรีสะเกษ)\n"
                    "• 19 ธ.ค.: ไทบ้านแลนด์ 7.0 มิวสิกเฟสติวัล (ณ ลานกิจกรรมไทบ้านแลนด์ อบต.น้ำคำ)\n\n"
                    "แล้วชวนเพื่อน ชวนครอบครัว มาเจอกันที่ 'ศรีสะเกษ เมืองแห่งโอกาส'\n"
                    "Sound of Sisaket 2026 รอทุกคนมาสัมผัสเสียงดนตรีและบรรยากาศของเมืองกันอยู่!\n\n"
                    "#ศรีสะเกษเมืองแห่งโอกาส #ปฏิทินกิจกรรมศรีสะเกษ #เที่ยวศรีสะเกษ #Sisaket #SoundOfSisaket2026 #หอการค้าจังหวัดศรีสะเกษ"
                ),
                "location": "เกาะห้วยน้ำคำ & เมืองศรีสะเกษ",
                "image_url": "/images/sisaket-resonance-calendar-2026.webp",
                "image_alt": "ปฏิทินกิจกรรมศรีสะเกษ Sisaket Resonance พฤศจิกายน - ธันวาคม 2569",
                "is_published": True,
            },
            {
                "kind": EditorialEntry.Kind.STORY,
                "title": "Sound of Sisaket 2026 & เทศกาลดนตรีปลายปี",
                "title_en": "Sound of Sisaket 2026 Festival",
                "summary": "สัมผัสเสียงดนตรีและบรรยากาศเมืองศรีสะเกษ มหกรรมดนตรี ศิลปะ กาแฟ และงานแคมป์สุดอบอุ่นปลายปี",
                "summary_en": "Experience music and local arts in Sisaket year-end festival.",
                "body": (
                    "Sound of Sisaket 2026 มหกรรมดนตรีและศิลปะประจำปีจังหวัดศรีสะเกษ\n"
                    "จัดขึ้นระหว่างวันที่ 16-20 ธันวาคม 2569 ณ สวนเฉลิมพระเกียรติฯ เกาะห้วยน้ำคำ\n\n"
                    "พบกับการแสดงดนตรีสดหลากหลายแนว ตลาดกาแฟสดดินภูเขาไฟ GI ร้านค้า OTOP ชุมชน และกิจกรรมสร้างสรรค์สำหรับทุกคนในครอบครัว"
                ),
                "location": "สวนเฉลิมพระเกียรติฯ (เกาะห้วยน้ำคำ)",
                "image_url": "/images/sisaket-nature-concept.webp",
                "image_alt": "Sound of Sisaket 2026",
                "is_published": True,
            },
            {
                "kind": EditorialEntry.Kind.STORY,
                "title": "เทศกาลกาแฟและดนตรี ครั้งที่ 4 (Sisaket Coffee & Music Fest #4)",
                "title_en": "4th Sisaket Coffee & Music Fest",
                "summary": "จิบกาแฟสดดินภูเขาไฟ GI เคล้าเสียงดนตรีสบาย ๆ ริมบึงห้วยน้ำคำ 13-15 พฤศจิกายน 2569",
                "summary_en": "Enjoy GI volcano coffee with relaxing live music by Huai Nam Kham Lake.",
                "body": (
                    "เทศกาลกาแฟและดนตรีครั้งที่ 4 รวบรวมโรงคั่วและร้านกาแฟชั้นนำทั่วศรีสะเกษ โดยเฉพาะกาแฟโรบัสต้าและอาราบิก้าดินภูเขาไฟ GI อำเภอขุนหาญ\n"
                    "ร่วมฟังดนตรีอคูสติกเบาๆ ริมบึง ชิมเบเกอรี่และเครื่องดื่มคราฟท์สมุนไพรพื้นบ้าน"
                ),
                "location": "ลานหลังศรีสะเกษอะควาเรียม • เกาะห้วยน้ำคำ",
                "image_url": "/images/sisaket-nature-concept.webp",
                "image_alt": "เทศกาลกาแฟและดนตรี",
                "is_published": True,
            },
            {
                "kind": EditorialEntry.Kind.STORY,
                "title": "งานฉลองเมือง 244 ปี ศรีสะเกษ",
                "title_en": "244th Sisaket City Anniversary Celebration",
                "summary": "ร่วมฉลองประวัติศาสตร์ 244 ปี ศรีสะเกษ รำบวงสรวง 4 ชนเผ่า และการแสดงศิลปวัฒนธรรมตระการตา 18-22 พฤศจิกายน 2569",
                "summary_en": "Celebrate 244 years of Sisaket history with traditional 4-tribe dance and cultural shows.",
                "body": (
                    "งานฉลองเมือง 244 ปี จังหวัดศรีสะเกษ ร่วมรำบวงสรวงสักการะสิ่งศักดิ์สิทธิ์ประจำเมือง โดยนางรำ 4 ชนเผ่า (เขมร ส่วย ลาว เยอ) กว่าหมื่นคน\n"
                    "พร้อมชมนิทรรศการประวัติศาสตร์ การออกร้าน OTOP และการแสดงแสงสีเสียงตระการตา"
                ),
                "location": "สวนเฉลิมพระเกียรติฯ เกาะห้วยน้ำคำ",
                "image_url": "/images/sisaket-nature-concept.webp",
                "image_alt": "งานฉลองเมือง 244 ปี ศรีสะเกษ",
                "is_published": True,
            },
            {
                "kind": EditorialEntry.Kind.COMMUNITY,
                "title": "โกโก้คราฟท์ COCOA CrafT - ช็อกโกแลตคราฟท์ฟู้ดทรักศรีสะเกษ",
                "title_en": "COCOA CrafT - Sisaket Premium Cocoa Foodtruck",
                "summary": "เมนูซิกเนเจอร์ เมล็ดโกโก้พรีเมียมเข้มข้นหวานน้อย พร้อมกาแฟสด ชาไทย มัทฉะ และเครื่องดื่มชงสด รูปแบบ Foodtruck พร้อมรับงานนอกสถานที่",
                "summary_en": "Signature African premium cocoa drinks, less sweet, served fresh from a food truck.",
                "body": (
                    "โกโก้คราฟท์ COCOA CrafT (since 2022)\n\n"
                    "เมนูซิกเนเจอร์ ใช้เมล็ดพันธุ์โกโก้พรีเมียมจากทวีปแอฟริกา ผสานส่วนผสมที่ลงตัวทำให้ได้ 'โกโก้คราฟท์' ที่เข้มข้นหวานน้อย เลือกจับคู่กับเครื่องดื่มได้หลากหลาย\n\n"
                    "นอกจากนี้ยังมี กาแฟสด มัทฉะ ชาไทย ชาเขียว เผือก เครื่องดื่มชงสด/ปั่น น้ำผลไม้ น้ำส้ม น้ำมะพร้าว เลม่อนดองน้ำผึ้ง ฯลฯ ใช้วัตถุดิบอย่างดี ใส่ใจทุกแก้ว\n\n"
                    "ตั้งใจทำหน้าร้านเป็นรูปแบบ FOODTRUCK (ฟู้ดทรัก) สามารถส่งความสดชื่นไปถึงคุณได้ทุกที่ รับงานนอกสถานที่ งานอีเวนต์ งานบุญ งานบวช งานแต่ง งานวันเกิด ขึ้นบ้านใหม่ งานโรงทาน ฯลฯ\n\n"
                    "รับทำน้ำชง ชาไทย ชาเขียว ชานม โกโก้ กาแฟโบราณ บรรจุขวด หรือใส่แก้ว เพื่อแจกโรงทาน\n\n"
                    "อัตราค่าน้ำมัน: ค้นหาจากระยะทางไปกลับ จาก เกาะกลางน้ำศรีสะเกษ ถึง ปลายทาง (ฟรี 10 กิโลเมตรแรก, กิโลเมตรที่ 11 เป็นต้นไป กิโลเมตรละ 5 บาท)\n\n"
                    "📞 โทร: 0935645996, 0981512942\n"
                    "📱 TikTok / FB / IG: โกโก้คราฟท์ COCOA CrafT\n"
                    "#โกโก้คราฟท์ #OTOP #ของดีจังหวัดศรีสะเกษ"
                ),
                "location": "เกาะกลางน้ำศรีสะเกษ / อำเภอเมืองศรีสะเกษ",
                "image_url": "/images/sisaket-nature-concept.webp",
                "image_alt": "โกโก้คราฟท์ COCOA CrafT Foodtruck",
                "is_published": True,
            },
            {
                "kind": EditorialEntry.Kind.COMMUNITY,
                "title": "วิถีชีวิต 13 ชุมชนนวัตวิถีศรีสะเกษ",
                "title_en": "13 OTOP Nawatwithi Villages of Sisaket",
                "summary": "สัมผัสเสน่ห์วิถีชีวิต ทอมือ ทุเรียนภูเขาไฟ หัตถกรรมจักสาน และรอยยิ้มของชาวบ้านศรีสะเกษ",
                "summary_en": "Discover local crafts, volcano durian orchards, and warm smiles across 13 Sisaket villages.",
                "body": (
                    "เที่ยวชม 13 หมู่บ้าน OTOP นวัตวิถีศรีสะเกษ เรียนรู้วัฒนธรรม 4 ชนเผ่า (เขมร ส่วย ลาว เยอ)\n"
                    "สัมผัสวิถีชีวิตการทอผ้าลายโบราณ การทำจักสานหวายบ้านละทาย และชิมผลไม้สดจากสวนดินภูเขาไฟ"
                ),
                "location": "จังหวัดศรีสะเกษ",
                "image_url": "/images/sisaket-nature-concept.webp",
                "image_alt": "ชุมชนนวัตวิถีศรีสะเกษ",
                "is_published": True,
            },
        ]

        for s in stories:
            EditorialEntry.objects.get_or_create(
                title=s["title"],
                defaults=s,
            )

