# Module: Vendor Portals & Admin Operations Overhaul (EP 1 - EP 6)

## ทำอะไร
- ปรับปรุงและยกเครื่องระบบบริหารจัดการของผู้ประกอบการชุมชน (Vendor Portals) และศูนย์ควบคุมของผู้ดูแลระบบ (Admin Operations) ให้เชื่อมต่อกับฐานข้อมูลจริง 100% พร้อมตัด Mockup Data และ Emojis ออกทั้งหมด โดยใช้ Lucide Icons แทน:
  1. **Homestay & Booking Calendar (EP 1):** ระบบ CRUD โฮมสเตย์และห้องพัก พร้อมหน้าปฏิทิน Mini-PMS สำหรับเจ้าของที่พักตรวจสอบห้องว่างและบุ๊กกิ้งของแขกจริง (`/portal/homestay`, `/portal/calendar`)
  2. **OTOP Community Store (EP 2):** ระบบจัดการสต็อกสินค้าชุมชน ปรับสต็อกแบบตัวเลขตรง (Direct Stock Quantity Editor) และอัปโหลดภาพผ่าน Media API (`/portal/otop`, `/otop`)
  3. **Healthy Dining & Restaurant (EP 3):** ระบบจัดการเมนูอาหารสุขภาพ รองรับ 5 หมวดหมู่นิเวศน์ตาม Backend (`LOW_SUGAR`, `LOW_SODIUM`, `ORGANIC`, `HERBAL`, `VEGAN`) และระบุแคลอรี่ (`/portal/restaurant`, `/foods`)
  4. **Wellness & Spa Studio (EP 4):** ระบบบริการนวดและสปาสุขภาพ พร้อมระบบจัดตารางเวลาและรอบบริการ (Time Slot Scheduling Engine) รองรับการลบและเพิ่มรอบเวลาจริง (`/portal/wellness`, `/wellness`)
  5. **Tourist Multi-Vendor Booking & Payment (EP 5):** ตรวจสอบการจองแบบ multi-vendor, ตะกร้าสินค้า, หน้าชำระเงินโอนบัญชีกสิกรไทย, อัปโหลดสลิป, ตัวนับเวลาถอยหลัง และ Digital Voucher (`/cart`, `/checkout`, `/checkout/payment/[id]`, `/my-bookings/[id]`)
  6. **Admin Operations Center (EP 6):** ปรับใช้ระบบ One-Time Merchant KYC Approval (อนุมัติร้านค้าครั้งเดียว สินค้าเปิดขายทันที), แสดงชื่อ/อีเมล/เบอร์โทรจริงของเจ้าของในแคตตาล็อก และระบบตรวจสลิปโอนเงิน (`/admin/*`)

## ทำไมถึงทำแบบนี้
- **Zero Mockup Data & Strict Data Binding:** ระบบเดิมมีข้อมูลฮาร์ดโค้ดปะปน ทำให้เกิดความสับสนเมื่อนำไปใช้งานจริง การต่อเข้ากับ API จริงทั้งหมดช่วยให้ร้านค้าเห็นสถานะจริงทันที
- **One-Time Merchant KYC Approval:** เดิมแอดมินต้องคอยอนุมัติสินค้าและบริการทุกชิ้น ทำให้ร้านค้าลงของแล้วไม่แสดงและสร้างภาระหนักให้แอดมิน จึงเปลี่ยนเป็นอนุมัติร้านค้าตอนสมัครครั้งเดียว เมื่อร้านผ่านแล้ว สินค้า/ห้องพัก/เมนู จะ `ACTIVE` อัตโนมัติ
- **Lucide Icons Only (Zero Emojis):** เพื่อความเป็นมืออาชีพ ดูเป็นระบบ Production ระดับ Enterprise ที่สะอาดและสม่ำเสมอ
- **ทางเลือกอื่นที่คิดไว้:**
  - *คงระบบอนุมัติรายชิ้นไว้:* ทำให้การทำงานล่าช้ามาก ไม่เหมาะกับวิสาหกิจชุมชน
  - *ให้ Vendor ทุกประเภทรวมปฏิทินในหน้าเดียว:* ทำให้เกิดความสับสน จึงแยกปฏิทินการจองห้องพัก (Room Calendar) ไว้เฉพาะเจ้าของโฮมสเตย์ และแยกระบบรอบเวลา (Time Slots) ไว้เฉพาะเจ้าของสปา

## โครงสร้างไฟล์
### 1. Frontend
- `frontend/src/app/(portal)/portal/homestay/page.tsx`: สตูดิโอจัดการโฮมสเตย์และห้องพัก
- `frontend/src/app/(portal)/portal/calendar/page.tsx`: Mini-PMS ปฏิทินแสดงการจองห้องพัก
- `frontend/src/app/(portal)/portal/otop/page.tsx`: สตูดิโอจัดการสินค้าชุมชน OTOP และสต็อก
- `frontend/src/app/(portal)/portal/restaurant/page.tsx`: สตูดิโอจัดการเมนูอาหารเพื่อสุขภาพ
- `frontend/src/app/(portal)/portal/wellness/page.tsx`: สตูดิโอจัดการบริการนวดสปาและรอบเวลา (Time Slots)
- `frontend/src/app/(admin)/admin/approvals/page.tsx`: หน้าอนุมัติพาร์ทเนอร์และร้านค้า (Merchant KYC)
- `frontend/src/app/(admin)/admin/catalog/page.tsx`: หน้าตรวจสอบแคตตาล็อกรวมพร้อมข้อมูลเจ้าของจริง
- `frontend/src/app/(admin)/admin/payments/page.tsx`: หน้าตรวจสอบสลิปการโอนเงินและอนุมัติการจอง
- `frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx`: หน้าชำระเงินและอัปโหลดสลิป
- `frontend/src/lib/api/vendor.ts`: ฟังก์ชัน API สำหรับ Vendor CRUD ทั้งหมด
- `frontend/src/types/catalog.ts`: Type definition สำหรับ Catalog ทั้งระบบ

### 2. Backend
- `backend/apps/services/views.py`: เพิ่ม `WellnessSlotDetailDeleteView` สำหรับลบรอบเวลา และเพิ่ม `select_related("owner")`
- `backend/apps/services/urls.py`: เพิ่ม route `/wellness/slots/<int:slot_id>/`
- `backend/apps/services/serializers.py`: เพิ่ม `owner_name`, `owner_email`, `owner_phone` ใน `FoodMenuSerializer` และ `WellnessServiceSerializer`
- `backend/apps/otop/serializers.py`: เพิ่มข้อมูลเจ้าของใน `OTOPProductSerializer`
- `backend/apps/accommodations/serializers.py`: เพิ่มข้อมูลเจ้าของใน `AccommodationSerializer`
- `backend/apps/authentication/views.py`: ระบบ Auto-activate เมื่ออนุมัติร้านค้า

## จุดที่ต้องระวัง
- **Type ของ Wellness Time Slot:** `slot_id` ของรอบเวลาสปาเป็นตัวเลขแบบ Big Integer (BIGSERIAL) ในฐานข้อมูล ต่างจาก entity อื่นๆ ในระบบที่เป็น UUID ห้ามส่งค่าเป็น UUID
- **การจัดการภาพถ่าย:** ควรใช้ Image Upload API (`/api/v1/media/upload/`) แทนการส่งเป็น Base64 Data URL เสมอ เพื่อลดขนาด Payload
- **ความปลอดภัยสิทธิ์การเข้าถึง (IDOR):** เวลาแก้ไขหรือลบสินค้า/สล็อต ต้องตรวจสอบว่าผู้ใช้งานเป็นเจ้าของจริง (`owner=request.user`) ก่อนลบเสมอ

## อ้างอิง
- `AGENTS.md` (รัฐธรรมนูญนักพัฒนา 19 Iron Rules)
- คู่มือ Phase 1 Specification (WellTrip Community Tourism System)
- บทเรียนที่ได้: การออกแบบ Data Model และ Serializer ที่รอบคอบตั้งแต่แรก ช่วยลด N+1 Query และป้องกันปัญหาข้อมูลหลอกในหน้าบ้านได้อย่างมีประสิทธิภาพ
