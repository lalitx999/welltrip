# Vault-inspired Django Admin

ชุดธีม Django Admin แบบแยก ติดตั้งเข้าโปรเจกต์อื่นได้ โทน sidebar ดำ ปุ่มเขียว พื้นหลังอ่อน และการ์ดมุมโค้ง อ้างอิงหน้าตา [Vault Dashboard](https://vault.dashboardpack.com/dashboard) จาก [ลิงก์ที่ได้รับ](https://dashboardpack.com/live-demo-preview/?livedemo=391606)

เขียน Django templates, CSS และ JavaScript ใหม่ ไม่ใช่ซอร์สต้นฉบับหรือผลิตภัณฑ์ของ DashboardPack ไม่ได้รวมหน้าการลงทุนทั้ง 55+ หน้าหรือกราฟของต้นฉบับ ชุดนี้ปรับหน้าจอ Django Admin สำหรับจัดการโมเดลจริง ไม่ใส่ยอดเงินหรือข้อมูลจำลองใน dashboard ของโปรเจกต์ที่ติดตั้ง

## สิ่งที่ได้

- หน้า Dashboard: จำนวนแอปและโมเดลที่ผู้ใช้มีสิทธิ์เข้าถึง พร้อมรายการโมเดลและ Recent actions ของ Django
- Sidebar: เมนูจาก `available_apps`, ค้นหาชื่อเมนู, ไฮไลต์โมเดลปัจจุบัน และ drawer บนมือถือ
- หน้า list, search, filter, pagination, bulk actions, add/change, delete confirmation และ history ใช้พฤติกรรมเดิมของ Django
- หน้า login และเปลี่ยนรหัสผ่าน
- Light / Dark / Auto ใช้ตัวสลับธีมของ Django
- ไม่ต้องใช้ Node, React, Tailwind หรือ CDN ไม่มีฟอนต์ภายนอก
- ไม่มี model หรือ migration เพิ่มในโปรเจกต์ที่ติดตั้ง

## ติดตั้งในโปรเจกต์ Django

ใช้ Python environment ของโปรเจกต์ปลายทาง แล้วติดตั้งจากโฟลเดอร์ที่แตก ZIP:

```bash
python -m pip install /path/to/django-vault-admin
```

ใน `settings.py` เพิ่ม `vault_admin` **ก่อน** `django.contrib.admin`:

```python
INSTALLED_APPS = [
    "vault_admin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # แอปของโปรเจกต์...
]
```

ใช้ DjangoTemplates ที่มี `APP_DIRS=True` และ context processors มาตรฐาน: request, auth, messages (ตัวอย่างครบอยู่ใน `demo/settings.py`) โปรเจกต์ต้องเปิดใช้งาน Django Admin ตามปกติ:

```python
from django.contrib import admin
from django.urls import path

admin.site.site_header = "My Project"
admin.site.site_title = "My Project Admin"

urlpatterns = [path("admin/", admin.site.urls)]
```

สำหรับ production:

```bash
python manage.py collectstatic --noinput
```

จากนั้น restart แอป และเปิด `/admin/` ระบบ authentication, CSRF และ permission ใช้ของ Django ตามเดิม โมเดลต้องลงทะเบียนกับ AdminSite ก่อนจึงปรากฏในเมนู

หากโปรเจกต์ใช้ custom AdminSite ให้ตั้ง `site_header` และ `site_title` ที่ instance นั้น ธีมใช้ URL namespace ปัจจุบันตามกลไก AdminSite ของ Django

## ทดลองแยกจากโปรเจกต์จริง

รันจากโฟลเดอร์ชุดธีม:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

เปิด http://127.0.0.1:8000/admin/ แล้วเข้าสู่ระบบด้วยบัญชีที่สร้าง Demo ใช้ SQLite ในโฟลเดอร์นี้และไม่เชื่อมต่อฐานข้อมูล Welltrip ค่า settings ของ demo สำหรับทดลองในเครื่องเท่านั้น ไม่ใช้เป็น production settings

## ปรับแต่ง

- สีหลักและสีพื้น: `vault_admin/static/vault_admin/theme.css` ตัวแปร `--primary`, `--button-bg`, `--body-bg`, `--vault-surface` และชุดตัวแปร dark mode
- โครง sidebar / branding: `vault_admin/templates/admin/base_site.html`
- การ์ดหน้าแรก: `vault_admin/templates/admin/index.html`
- การค้นหาเมนูและ drawer: `vault_admin/static/vault_admin/theme.js`
- ข้อความส่วนใหญ่ใช้ i18n ของ Django; ข้อความเพิ่มเติมในธีมยังเป็นภาษาอังกฤษ หากต้องการภาษาไทยทั้งชุดให้เพิ่ม translation catalog ของโปรเจกต์

ไฟล์ index ใช้ `{% extends "admin/index.html" %}` เพื่อสืบทอด template เดิมของ Django ผ่าน template-loader ไม่ใช่ recursion ผิดพลาด

หากต้องการแก้ไฟล์แล้วเห็นผลทันทีระหว่างพัฒนา ให้ติดตั้งด้วย `pip install -e /path/to/django-vault-admin` และรัน collectstatic ใหม่เมื่อนำขึ้น production

## ความเข้ากันได้และข้อจำกัด

ทดสอบจริงกับ **Django 5.2.17 / Python 3.14**; metadata อนุญาต Django 5.2–6.0 แต่ยังไม่ได้ทดสอบกับ 6.0 หากใช้เวอร์ชันอื่นให้ทดสอบหน้าของโปรเจกต์ก่อนนำขึ้นใช้งาน

อย่าเปิดใช้พร้อมธีมอื่นที่ override Django Admin เช่น Jazzmin/Unfold โดยไม่ตรวจ template precedence ก่อน หากมี `templates/admin/base_site.html` หรือ `templates/admin/index.html` ใน `TEMPLATES["DIRS"]` ไฟล์ของโปรเจกต์จะชนะไฟล์ในแพ็กเกจ ควรรวมการปรับแต่งให้เหมาะสม

Widgets จาก third-party และ inline forms ที่ปรับแต่งเองยังต้องตรวจในโปรเจกต์ปลายทาง ตัวธีมไม่ได้เพิ่ม API สำหรับข้อมูลธุรกิจหรือกราฟการลงทุน

## ตรวจสอบ

```bash
python manage.py check
python manage.py test demo
```

ทดสอบผ่าน 5 ชุด: login/anonymous redirect, หน้า admin หลักและ popup, permission ของ staff และบันทึกฟอร์ม, template/static resolution และตัว export fixture สำหรับตรวจภาพ ทดสอบบนฐานข้อมูลชั่วคราวของ Django test runner

ตรวจภาพ Dashboard, changelist, add form และ dark mode บน desktop; ตรวจ dashboard/drawer บน viewport มือถือ 390px และแก้ header ทับเนื้อหาแล้ว

## ถอนธีม

นำ `vault_admin` ออกจาก `INSTALLED_APPS` แล้ว restart แอป Django จะกลับไปใช้ templates เดิม ไม่มี migration ที่ต้องย้อนกลับ
