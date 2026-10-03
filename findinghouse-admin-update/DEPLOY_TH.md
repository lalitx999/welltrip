# Finding House — ชุดปรับ Django Admin

ชุดนี้นำไปวางทับโปรเจกต์ Finding House ได้โดยตรง ไม่ต้องติดตั้งแพ็กเกจ django-vault-admin ที่ทำไว้ก่อนหน้า

## ไฟล์สำหรับนำขึ้นเซิร์ฟเวอร์

ไฟล์อยู่ใต้ `backend/` ใน ZIP ให้คงตำแหน่งโฟลเดอร์เดิมทั้งหมด:

| ไฟล์ | สิ่งที่เปลี่ยน |
|---|---|
| `backend/templates/admin/base.html` | สืบทอด base ของ Django 4.2 คืนโครงหน้า, CSRF, assets และ blocks มาตรฐาน |
| `backend/templates/admin/base_site.html` | Branding, sidebar ตามสิทธิ์, ค้นหาเมนู, mobile drawer, Logout แบบ POST และตัวสลับธีม |
| `backend/templates/admin/index.html` | Dashboard การ์ดตัวเลขจริงและรายการล่าสุด รวมเมนูโมเดลและประวัติของ Django |
| `backend/templates/admin/change_list.html` | คืน Filters, Actions, sorting, pagination และบันทึก list_editable |
| `backend/templates/admin/change_form.html` | คืน form errors, media, slug scripts, inline formsets และ related widgets |
| `backend/templates/admin/login.html` | ใช้ฟอร์ม Login ของ Django พร้อมธีมใหม่ |
| `backend/templates/admin/app_index.html` | ใช้รายการแอปตามสิทธิ์ของ Django |
| `backend/templates/admin/object_history.html` | ใช้ประวัติมาตรฐานของ Django |
| `backend/templates/admin/delete_confirmation.html` | คืนรายการข้อมูลที่ได้รับผลกระทบและ hidden confirmation field สำหรับลบ |
| `backend/requirements.txt` | เพิ่ม requests>=2.32,<3 ที่โมดูล SMS เรียกใช้ |
| `backend/config/context_processors.py` | คำนวณ Dashboard เฉพาะหน้า index, ตรวจ permission, ใช้ ModelAdmin queryset, ไม่รวม soft-deleted records |
| `backend/static/findinghouse_admin/theme.css` | **ไฟล์ใหม่**: โทนเขียว/ดำ, cards, tables, forms, mobile และ Light/Dark/Auto |
| `backend/static/findinghouse_admin/theme.js` | **ไฟล์ใหม่**: ค้นหาเมนู, active link, drawer, keyboard focus และ Escape |
| `backend/config/test_admin_theme.py` | **ไฟล์ใหม่**: regression tests 12 ชุด; เป็นไฟล์ทดสอบ ไม่จำเป็นต่อ runtime |

รวม 14 ไฟล์: 11 ไฟล์เดิมที่แก้ และ 3 ไฟล์ใหม่ รวมไฟล์ dependency; ไฟล์ทดสอบไม่จำเป็นต่อ runtime

ไฟล์ template สั้นที่ extends ชื่อเดียวกับตัวเองเป็นวิธี template inheritance ของ Django: loader ข้ามไฟล์ปัจจุบันแล้วโหลด template ถัดไปจาก django.contrib.admin ไม่ใช่ infinite recursion ต้องคง `APP_DIRS=True` และ `TEMPLATES['DIRS']` เดิมของโปรเจกต์

## ขั้นตอนวางบนเซิร์ฟเวอร์

1. สำรอง `backend/templates/admin/` และ `backend/config/context_processors.py` ของเซิร์ฟเวอร์ก่อนวางทับ เก็บสำเนา static/findinghouse_admin ด้วยถ้าเคยติดตั้งมาก่อน
2. แตก ZIP และคัดลอก **เฉพาะเนื้อหาโฟลเดอร์ backend/** ไปผสานกับ backend ของโปรเจกต์ ห้ามลบ backend เดิมทั้งโฟลเดอร์
3. ใช้ environment เดิมของแอป แล้วรันจาก backend:

```bash
python --version
python -m django --version
python -m pip install -r requirements.txt
python manage.py check
python manage.py collectstatic --noinput
```

4. Restart service ของ Django/Gunicorn/Daphne ด้วยวิธี deployment ที่เซิร์ฟเวอร์ใช้อยู่ หากใช้ Docker และ source อยู่ใน image ให้ rebuild image แล้ว recreate service ตาม compose/deployment เดิม; ตรวจว่า collectstatic รันใน container/environment ที่ให้บริการจริง
5. เปิด `/admin/` แล้ว hard refresh ตรวจ static files ของ `admin/` และ `findinghouse_admin/` ว่าไม่ตอบ 404

**ติดตั้ง dependencies จาก requirements.txt ใหม่ มี requests เพิ่มเติม; ไม่ต้องเปลี่ยน INSTALLED_APPS และไม่ต้อง migrate จากการแก้ไขชุดนี้** และไม่ต้องเปลี่ยนไฟล์ `.env`, models, API หรือฐานข้อมูล

## ลิงก์เว็บหลัก (ตัวเลือก)

ลิงก์ `localhost:3000` เดิมถูกยกเลิก หากต้องการให้ปุ่ม “เว็บหลัก” แสดง ให้เพิ่มค่า URL จริงใน settings ของเซิร์ฟเวอร์:

```python
FINDINGHOUSE_SITE_URL = "https://your-public-site.example"
```

รองรับ URL แบบ http/https เท่านั้น หากไม่ตั้งค่า ปุ่มนี้จะไม่แสดง

## สิทธิ์และข้อมูล Dashboard

- เมนูสร้างจาก available_apps ของ Django ผู้ใช้เห็นเฉพาะโมเดลที่เข้าถึงได้
- ตัวเลขและรายการ Dashboard ต้องผ่าน ModelAdmin.has_view_or_change_permission และ get_queryset ของโมเดลนั้น
- PropertyAdmin มีการจำกัด agent อยู่แล้ว จึงใช้ขอบเขตเดียวกันกับหน้ารายการประกาศ
- สิทธิ์ตามสาขาหรือ role ใน DRF ไม่ได้ถูกนำมาเปลี่ยน ModelAdmin อื่นโดยอัตโนมัติ ชุดนี้ยึดสิทธิ์และ queryset ที่ Admin ของแต่ละโมเดลกำหนดไว้ ไม่ได้เพิ่มระบบแบ่งสิทธิ์ใหม่ทั้งโปรเจกต์
- ไม่ query ข้อมูลธุรกิจบนหน้า login, changelist หรือ change form
- แสดงยอดปิดดีล, คอมมิชชัน, ส่วนแบ่งบริษัท, จำนวนประกาศ/ลีด/สัญญา/นัดหมาย และรายการล่าสุดตามสิทธิ์
- ข้อมูลสรุปจะไม่รวมรายการ soft-deleted; หากฐานข้อมูลอ่านไม่สำเร็จจะแสดงข้อความแจ้งและบันทึก server log แทนการแสดงศูนย์หลอก

`config/admin_site.py` เดิมไม่ได้ถูกเชื่อมกับ URL ปัจจุบัน จึงคงไว้โดยไม่เปิดใช้งานและไม่ย้าย model registration ชุดนี้ใช้ `admin.site` ตาม config/urls.py เดิม

## ผลตรวจสอบ

- Django 4.2.30 / Python 3.12.14 บน SQLite test database ชั่วคราว: 12 tests ผ่าน, system check ผ่าน
- ครอบคลุมหน้ารายการของทุกโมเดลที่ลงทะเบียน และหน้าเพิ่มที่อนุญาตให้เพิ่ม
- บันทึก category, list_editable ของ Article, รูปภาพ inline พร้อมกระบวนการ watermark ของเดิม, ลบข้อมูลทดสอบ และตรวจ history
- ตรวจ form errors, filter/action markup, media, popup และ permission ของ staff
- ตรวจ CSRF login/logout และไม่ query สถิติในหน้าที่ไม่จำเป็น
- Action AI ถูก mock ในการทดสอบการ dispatch ไม่ได้ตรวจผลลัพธ์จากบริการ AI จริง
- ตรวจเบราว์เซอร์: Dashboard, ตาราง dark mode, slug อัตโนมัติ, เพิ่ม image inline, mobile drawer 390px, ค้นหาเมนู และ Escape

ยังไม่ได้เชื่อม PostgreSQL หรือทดสอบบนเซิร์ฟเวอร์จริงของคุณ ให้ตรวจ workflow ตัวอย่างหลังนำขึ้น staging/เซิร์ฟเวอร์ โดยเฉพาะ export, webhook และ integration ภายนอก

Python ใน venv เดิมบน Mac เป็น 3.14 และพบข้อผิดพลาดของ Django 4.2 template context กับ Python รุ่นนั้น จึงทดสอบด้วย Python 3.12 โดยไม่แก้ framework ส่วน Dockerfile ของโปรเจกต์ระบุ Python 3.11 อยู่แล้ว ชุดนี้ไม่ได้อัปเกรด Django หรือแก้ venv เดิม

## รัน regression tests แบบแยก

ใช้ Python 3.11/3.12 ที่มี dependency ของโปรเจกต์ติดตั้งอยู่ ตั้งค่าตัวแปรต่อไปนี้โดยใช้ path จริง:

```bash
export FH_TEST_BACKEND=/absolute/path/to/findinghouse/backend
export PYTHONPATH="$FH_TEST_BACKEND:/absolute/path/to/extracted/findinghouse-admin-update/verification"
python -m django test config.test_admin_theme --settings=theme_test_settings
```

settings ทดสอบไม่ import production settings และไม่โหลด .env ใช้ SQLite ในหน่วยความจำ และ local email backend เท่านั้น Test runner หยุด audit receivers ชั่วคราวระหว่างสร้างฐานทดสอบ เพราะ receiver เดิมพยายามบันทึกก่อนตาราง audit ถูกสร้าง แล้วคืน receivers ก่อนเริ่มทดสอบ

## ย้อนกลับ

นำ templates/admin และ context_processors.py จาก backup **ของเซิร์ฟเวอร์นั้น** กลับมาทับ แล้ว restart service สำหรับ CSS/JS ชื่อใหม่ สามารถทิ้งไว้ได้เพราะ template เดิมไม่อ้างถึง ไม่ต้องย้อน migration

## แก้ไขเพิ่มเติม: missing requests

ติดตั้ง requests ใน venv ของ Mac และเพิ่มใน requirements.txt แล้ว ตรวจ `python manage.py check` กับ settings/URL ของโปรเจกต์จริงผ่าน: System check identified no issues (0 silenced). การตรวจนี้ไม่ใช่การทดสอบหน้าเว็บบน Python 3.14; ข้อจำกัดเวอร์ชัน Python ที่ระบุข้างต้นยังคงอยู่
