# รายงานตรวจสอบโครงการ WellTrip

วันที่ตรวจ: 9 กันยายน 2026
ขอบเขต: source code และเอกสารใน workspace ปัจจุบัน ตั้งแต่หน้าแรก สมัครสมาชิก เข้าสู่ระบบ catalog/cart/checkout/payment ประวัติการจอง portal สิทธิ์ผู้ใช้ inventory และ deployment configuration

## สรุปผล

**ยังไม่ควรเปิดรับการจองและเงินจริงก่อนแก้กลุ่ม P1 และตรวจ end-to-end บนสภาพแวดล้อมทดสอบ** พบ 30 ประเด็นที่ควรแก้หรือตรวจยืนยันต่อ แบ่งตามรายการด้านล่าง ไม่ใช่จำนวนช่องโหว่ที่ exploit สำเร็จ

ปัญหาแรกที่กระทบเส้นทางหลักคือ frontend อ่าน response login/refresh ไม่ตรง envelope ของ backend แม้ API สำเร็จ session ก็รับค่าผิด นอกจากนี้มีช่องรับราคาห้องติดลบ การแก้ยอดห้องคงเหลือที่ไม่สัมพันธ์กับยอดจอง และช่องว่างในวงจรสลิป/หมดอายุที่ต้องจัดการก่อนใช้งานจริง

## วิธีตรวจและข้อจำกัด

- อ่านไฟล์แนบ กติกา master, docs C1–C12 และเอกสาร Phase1/Phase1Full ประกอบกับ source ของ backend/frontend, models, migrations, routes, permissions, serializers, services, tasks และ configuration
- ตรวจเส้นทางข้อมูลและสิทธิ์ข้ามชั้น ไม่ถือข้อความว่า “เสร็จแล้ว” หรือผลทดสอบเก่าในเอกสารเป็นหลักฐานว่ารอบนี้ผ่าน
- เป็น **static review** ไม่ได้รัน npm/build/test, server, database, migration, browser flow หรือทดสอบโจมตี ตามกติกา R0/NO TERMINAL AUTO RUN ที่พบในเอกสาร ช่วงเริ่มต้นใช้ terminal สำรวจ/อ่านไฟล์ก่อนพบกติกา จากนั้นหยุดใช้และอ่านไฟล์โดยตรง
- ไม่ได้แก้ application code, auth files, configuration, database หรือ deploy เขียนเฉพาะรายงานนี้ ไม่เปิดเผยค่า secret
- ยังไม่ยืนยันค่าจริงของ production, reverse proxy, storage permissions, Redis/worker, Google/provider และ dependency vulnerabilities จากแหล่ง advisories จึงไม่มีคำรับรองว่าไม่มีช่องโหว่อื่น
- “ยืนยันจากโค้ด” หมายถึงพบเงื่อนไขและเส้นทางใน source; race condition, ผล DB บางกรณี และภาพ UI ยังต้องทดลองจริง ส่วนข้อแฝงระบุชัดว่าขึ้นกับ feature ที่ยังไม่เชื่อม

ระดับ: **P1** ควรแก้ก่อนเปิดใช้ธุรกรรมจริง เพราะกระทบ login/เงิน/stock/ข้อมูลหรือความปลอดภัย; **P2** บั๊กและความทนทานที่ควรแก้ในรอบถัดไปหรือก่อน flow นั้นใช้งานจริง; **P3** UX/accessibility และความครบถ้วน ไม่พบหลักฐานเพียงพอให้จัดข้อใดเป็น P0 ในรอบนี้

## แผนที่ความครอบคลุม

| ส่วน | ผลตรวจหลัก |
|---|---|
| หน้าแรก/navigation/i18n | ลิงก์บริการ/กระดิ่งยังไม่ทำงานครบ, semantic และภาษา |
| สมัครสมาชิก/login/Google/refresh | response contract เสีย, account linking และ callback binding |
| session/profile/ข้อมูลส่วนตัว | cache ไม่ล้างข้ามบัญชี, hydration/role gate ไม่ครบ |
| ที่พัก/ห้อง/ราคา/ค้นหา | ราคาติดลบ, stock overwrite, filter ตรงคนละห้อง, วันไม่จำกัด |
| อาหาร/OTOP | ขอบเขต quantity/ยอด/ชื่อ, portal ยังใช้ public list |
| Wellness | overlap race และ slot ในอดีต |
| Cart/checkout | cart identity ไม่คงที่, ไม่มี idempotency |
| Payment/slip/expiry | upload/privacy, review ชน expiry, provider contract และ UI status |
| ประวัติการจอง | private cache, pagination, auth readiness |
| Vendor portal | clear override ไม่ทำงาน, pagination/role navigation, API งานค้าง |
| Production/error handling | storage alias, exception disclosure, expiry recovery, rate limit |

## รายการข้อค้นพบ

### WT-01 — P1 — สัญญาข้อมูล Auth ไม่ตรงกัน ทำให้ login และ refresh ใช้งานผิด

หลักฐาน: [backend/common/responses.py:10](</Users/tanchonl/Documents/welltrip/backend/common/responses.py:10>), [backend/apps/authentication/views.py:92](</Users/tanchonl/Documents/welltrip/backend/apps/authentication/views.py:92>), [frontend/src/lib/auth-api.ts:24](</Users/tanchonl/Documents/welltrip/frontend/src/lib/auth-api.ts:24>), [frontend/src/lib/api-client.ts:46](</Users/tanchonl/Documents/welltrip/frontend/src/lib/api-client.ts:46>), [frontend/src/hooks/use-auth.tsx:84](</Users/tanchonl/Documents/welltrip/frontend/src/hooks/use-auth.tsx:84>)

ยืนยันจากโค้ด: API ส่ง {success, data: {user, access_token, refresh_token}} แต่ auth-api และ refresh อ่าน user/token จากชั้นนอก ไม่มี interceptor แกะ envelope ให้ จึงส่ง undefined เข้า token manager และ session แม้ API ตอบ 200

ผลกระทบ: login/Google login อาจพาไปหน้าแรกแต่ไม่มีผู้ใช้และ token ที่ถูกต้อง; refresh ก็ผิดแบบเดียวกัน ส่วนสมัครสมาชิกอาจสร้างบัญชีสำเร็จ เพราะหน้าสมัครไม่ได้ใช้ user ที่คืนมา จึงไม่ควรสรุปว่าสร้างบัญชีไม่ได้

แก้: กำหนดชนิด response และแกะ data ใน auth client ให้ตรงกันทุก endpoint อย่าเปลี่ยน interceptor รวมโดยไม่ตรวจ domain client ที่แกะ envelope เองอยู่แล้ว

ตรวจซ้ำ: สมัคร → login → profile → API ส่วนตัว → reload → access token หมดอายุ → refresh รวม Google login ต้องคงผู้ใช้และ token ที่ถูกต้อง

### WT-02 — P1 — Google auto-link เปิดทางให้บัญชีที่ลงทะเบียนดักไว้ยังใช้รหัสผ่านเดิมได้

หลักฐาน: [backend/apps/authentication/services.py:85](</Users/tanchonl/Documents/welltrip/backend/apps/authentication/services.py:85>), [backend/apps/authentication/views.py:44](</Users/tanchonl/Documents/welltrip/backend/apps/authentication/views.py:44>)

ยืนยันเส้นทางจากโค้ด; Google ยังต้องตั้งค่าจึงทดสอบจริงได้: manual registration ไม่พิสูจน์เจ้าของอีเมล เมื่อ Google login พบอีเมลเดียวกัน ระบบผูกบัญชีและตั้ง is_verified แต่เก็บ password เดิม

ตัวอย่าง: ผู้โจมตีสมัครด้วยอีเมลเหยื่อและรหัสที่ตนรู้ → เหยื่อเข้า Google → ได้บัญชีเดิมที่ผู้โจมตียังเข้าได้ด้วยรหัสผ่านนั้น

แก้: ห้าม auto-link บัญชี manual ที่ยังไม่พิสูจน์เจ้าของโดยคง credential เดิมไว้ ต้องมี flow ยืนยัน/กู้คืนบัญชีและยกเลิก session ที่เกี่ยวข้อง

ตรวจซ้ำ: จำลองอีเมลที่สมัครดักไว้ แล้ว Google login ต้องไม่ทำให้ password ของผู้สมัครดักเข้าถึงบัญชีที่ยืนยันแล้วได้

### WT-03 — P1 — Google callback ไม่ผูกกับการเริ่ม login ใน browser

หลักฐาน: [frontend/src/components/auth/google-button.tsx:30](</Users/tanchonl/Documents/welltrip/frontend/src/components/auth/google-button.tsx:30>), [frontend/src/app/(auth)/callback/google/page.tsx:40](</Users/tanchonl/Documents/welltrip/frontend/src/app/(auth)/callback/google/page.tsx:40>), [backend/apps/authentication/services.py:108](</Users/tanchonl/Documents/welltrip/backend/apps/authentication/services.py:108>)

ยืนยันจากโค้ด: nonce ถูกสร้างแต่ไม่เก็บและไม่ตรวจเทียบ; ไม่มี state ที่ตรวจกลับ callback รับ id_token จาก fragment แล้วส่ง backend ซึ่งตรวจ Google signature/audience แต่ไม่ได้ตรวจ nonce ของ login attempt

ผลกระทบ: เสี่ยง login CSRF โดยให้ browser เหยื่อรับ callback ของบัญชีผู้โจมตี เป็นความเสี่ยงหลัง Google/config และข้อ 01 พร้อมใช้งาน ไม่ใช่การปลอมลายเซ็น Google

แก้: ใช้ OAuth/OIDC flow ที่ตรวจ state และ nonce แบบใช้ครั้งเดียว และผูกกับ session ที่เริ่ม login

ตรวจซ้ำ: callback ที่ไม่เคยเริ่ม login, state ผิด, nonce ผิด และ callback ซ้ำต้องถูกปฏิเสธ

### WT-04 — P2 — Google ออก token ให้ผู้ใช้ inactive

หลักฐาน: [backend/apps/authentication/services.py:81](</Users/tanchonl/Documents/welltrip/backend/apps/authentication/services.py:81>), [backend/apps/authentication/views.py:127](</Users/tanchonl/Documents/welltrip/backend/apps/authentication/views.py:127>)

ยืนยันจากโค้ด: Google service คืนผู้ใช้เดิมโดยไม่เช็ก is_active ก่อน view ออก JWT

ผลกระทบ: บัญชีที่ปิดใช้งานยังได้รับ token และ frontend อาจแสดงว่า login สำเร็จ อย่างไรก็ตาม protected API มีการตรวจ active จึงยังไม่มีหลักฐานว่าข้ามสิทธิ์อ่านข้อมูลได้

แก้และตรวจซ้ำ: ตรวจ active ก่อนออก token ทุกช่องทาง; บัญชี inactive ต้องถูกปฏิเสธทั้ง manual และ Google login

### WT-05 — P1 — cache ข้อมูลส่วนตัวค้างข้ามการ logout/สลับบัญชี

หลักฐาน: [frontend/src/components/providers.tsx:9](</Users/tanchonl/Documents/welltrip/frontend/src/components/providers.tsx:9>), [frontend/src/hooks/use-auth.tsx:109](</Users/tanchonl/Documents/welltrip/frontend/src/hooks/use-auth.tsx:109>), [frontend/src/app/(mobile-tourist)/my-bookings/page.tsx:46](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/my-bookings/page.tsx:46>), [frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:54](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:54>)

ยืนยันโครงสร้างจากโค้ด; ต้องตรวจการแสดงผลด้วย browser: QueryClient อยู่ระดับแอปและ logout ไม่ล้าง query cache ขณะที่ key รายการจอง/รายละเอียด/payment ไม่รวม user id

ผลกระทบ: เครื่องที่ใช้ร่วมกันอาจเห็นข้อมูลผู้ใช้เก่าจาก cache ระหว่าง refetch หรือเครือข่ายช้า หลังแก้ auth แล้ว ข้อนี้เป็นการรั่วฝั่ง client; backend ยังคัดกรองเจ้าของ

แก้: cancel และ remove private queries เมื่อ session เปลี่ยน ใส่ user id ใน query key และ enabled หลัง auth พร้อม

ตรวจซ้ำ: A เปิดรายการ/สลิป → logout → B login → ย้อนกลับพร้อม network ช้า/offline ต้องไม่เห็นข้อมูล A แม้ชั่วครู่

### WT-06 — P1 — price_override รับศูนย์/ติดลบ ทำให้ยอดผิดหรือ checkout 500

หลักฐาน: [backend/apps/accommodations/serializers.py:149](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/serializers.py:149>), [backend/apps/accommodations/views.py:381](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/views.py:381>), [backend/apps/bookings/services.py:81](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:81>)

ยืนยันจากโค้ด: DecimalField ของราคา override ไม่มี min_value และเส้นทาง save ไม่เรียก full_clean; validator ใน model ไม่ได้ป้องกันการ save ลักษณะนี้และไม่ใช่ DB CHECK

ผลกระทบ: ราคาติดลบถูกใช้คำนวณ booking ได้ ถ้ายอดรวมไม่เป็นบวกจะชน payment validation; ถ้าตะกร้าผสมยังมียอดบวก ห้องติดลบจะลดยอดของรายการอื่นผิดธุรกิจ

แก้: กำหนดราคาต่ำสุดตามนโยบายที่ serializer/service และ DB constraint รวมถึงตรวจยอด payment ก่อนเขียน; null ยังใช้ล้าง override ได้

ตรวจซ้ำ: -1, 0, null, ค่าบวก ทั้งห้องเดี่ยวและตะกร้าผสมต้องได้ผลที่กำหนดและไม่มี 500

### WT-07 — P1 — แก้ available_count แบบยอดคงเหลือสัมบูรณ์ทำให้ขายห้องเกินได้

หลักฐาน: [backend/apps/accommodations/views.py:355](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/views.py:355>), [backend/apps/accommodations/views.py:394](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/views.py:394>), [backend/apps/bookings/services.py:388](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:388>)

ยืนยันลำดับตรรกะจากโค้ด: owner ตั้ง available_count ได้ถึง total_inventory โดยไม่หัก active holds ขณะที่ expiry เพิ่ม stock กลับ

ตัวอย่าง inventory=1: จอง A เหลือ 0 → owner ตั้งเป็น 1 → จอง B เหลือ 0 → A หมดอายุ เพิ่มกลับเป็น 1 ทั้งที่ B ยังถือห้องอยู่ นอกจากนี้การตั้ง 0 เพื่อปิดขายอาจถูก expiry เปิดคืน

แก้: แยกจำนวนจริง/ปิดขาย/ยอดจอง แล้วคำนวณ available ภายใต้ lock เดียวกัน ไม่แก้ด้วยการ clamp อย่างเดียวเพราะอาจทำ stock สูญหาย

ตรวจซ้ำ: scenario ข้างต้น รวม owner update ชน checkout/expiry ต้องรักษาสมการ stock และไม่เปิดห้องที่ปิดขาย

### WT-08 — P1 — สร้าง wellness slot พร้อมกันแล้วช่วงเวลาซ้อนกันได้

หลักฐาน: [backend/apps/services/services.py:71](</Users/tanchonl/Documents/welltrip/backend/apps/services/services.py:71>), [backend/apps/services/views.py:188](</Users/tanchonl/Documents/welltrip/backend/apps/services/views.py:188>)

ยืนยันช่องว่าง concurrency จากโค้ด; ยังไม่รัน concurrent test: ตรวจ overlap แล้ว create โดยไม่มี transaction/lock ครอบการตัดสินใจ unique constraint ป้องกันได้เฉพาะเวลาเริ่มเดียวกัน

ผลกระทบ: สอง request คนละเวลาเริ่มแต่ช่วงเวลาทับกันสามารถผ่านพร้อมกัน; เวลาเริ่มเดียวกันอาจจบด้วย IntegrityError/500

แก้: lock แถว service ใน transaction ก่อนตรวจและสร้างทุกเส้นทาง หรือใช้ constraint ป้องกันช่วงซ้อนในฐานข้อมูล พร้อมแปลง conflict เป็น 409

ตรวจซ้ำ: ยิงสอง request ช่วงทับกันพร้อมกันต้องสำเร็จเพียงหนึ่งรายการ; ช่วงติดกันที่ไม่ทับต้องผ่าน

### WT-09 — P1 — backend ยังยอมรับวันพักและ wellness session ที่ผ่านมาแล้ว

หลักฐาน: [backend/apps/bookings/serializers.py:69](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/serializers.py:69>), [backend/apps/bookings/services.py:119](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:119>), [backend/apps/bookings/services.py:214](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:214>)

ยืนยันจากโค้ด: ที่พักตรวจ checkout > checkin แต่ไม่ตรวจวันปัจจุบัน; wellness ตรวจ slot/จำนวนแต่ไม่ตัดเวลาที่ผ่านแล้ว การกำหนด min ใน HTML ไม่ป้องกันการเรียก API ตรง

ผลกระทบ: จองและสร้างยอดชำระสำหรับบริการย้อนหลังได้ รวม session วันนี้ที่ผ่านเวลาไปแล้ว

แก้: กำหนด timezone ธุรกิจและ cutoff ให้ชัด ตรวจใน backend และซ่อน slot ที่จองไม่ได้

ตรวจซ้ำ: เมื่อวาน, session ที่จบแล้ววันนี้, เวลาใกล้เที่ยงคืน และ browser คนละ timezone ต้องให้ผลตามเวลาเดียวกัน

### WT-10 — P1 — ช่วงวัน/ขนาดคำขอไม่จำกัด ทำให้งานต่อ request โตมาก

หลักฐาน: [backend/apps/accommodations/views.py:76](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/views.py:76>), [backend/apps/accommodations/views.py:203](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/views.py:203>), [backend/apps/bookings/services.py:119](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:119>)

ยืนยันต้นทุนไม่จำกัดจากโค้ด; ไม่ได้ทำ stress test: สร้างรายการวันทั้งช่วงและวนตรวจห้องก่อน pagination; checkout ประมวลผลรายคืน โดยไม่มีเพดานระยะพัก/booking horizon และจำนวนรายการที่เหมาะสม

ผลกระทบ: request ช่วงวันหลายปีอาจกิน CPU/หน่วยความจำ/DB มาก โดยเฉพาะ catalog สาธารณะ

แก้: จำกัดจำนวนคืน ช่วงล่วงหน้า และขนาด cart พร้อม query แบบ aggregate/batched และ rate limit

ตรวจซ้ำ: ช่วงเกินเพดานต้องตอบ 400 ก่อนวนวันที่หรือเขียน DB และตรวจจำนวน query ของช่วงสูงสุดที่อนุญาต

### WT-11 — P1 — URL สลิปเป็น public media ใน development และยังไม่มี private storage policy

หลักฐาน: [backend/apps/payments/models.py:114](</Users/tanchonl/Documents/welltrip/backend/apps/payments/models.py:114>), [backend/core/urls.py:28](</Users/tanchonl/Documents/welltrip/backend/core/urls.py:28>)

ยืนยันจาก routing เมื่อ DEBUG=True: ไฟล์ slips ถูกเสิร์ฟผ่าน media URL โดยไม่ตรวจเจ้าของ แม้ API payment จะตรวจ owner ชื่อไฟล์อาศัยชื่ออัปโหลดและโฟลเดอร์วันที่ ไม่ใช่สิทธิ์เข้าถึง

ผลกระทบ: ผู้ที่มี URL สามารถเปิดสลิปซึ่งมีข้อมูลธุรกรรมได้ ใน production ขึ้นกับ storage/proxy ที่ยังไม่ได้ตรวจ จึงไม่สรุปว่าระบบออนไลน์รั่วแล้ว

แก้: private storage และ endpoint ตรวจ owner หรือ URL อายุสั้นที่ออกหลังตรวจสิทธิ์; ไม่ใช้ public media สำหรับสลิป

ตรวจซ้ำ: anonymous/ผู้ใช้อื่นเปิด URL สลิปต้องถูกปฏิเสธ รวม URL เก่าหลังหมดอายุ

### WT-12 — P1 — อัปโหลดสลิปเป็น FileField ที่ไม่จำกัดเนื้อหา/ขนาด

หลักฐาน: [backend/apps/payments/serializers.py:64](</Users/tanchonl/Documents/welltrip/backend/apps/payments/serializers.py:64>), [backend/apps/payments/views.py:1](</Users/tanchonl/Documents/welltrip/backend/apps/payments/views.py:1>), [frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:213](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:213>)

ยืนยันจากโค้ด: ไม่มีการตรวจชนิดจริงของไฟล์ ขนาด หรือ quota ต่อ booking; accept=image/* เป็นข้อจำกัดเฉพาะ file picker

ผลกระทบ: รับไฟล์ที่ไม่ใช่สลิปและใช้พื้นที่เกินควร หากเสิร์ฟ HTML/SVG แบบ active content บน origin เดียวกันจะเพิ่มความเสี่ยงอีกชั้น ยังไม่ได้ทดสอบ exploit

แก้: allowlist รูปแบบตามนโยบาย ตรวจ signature/decode/ขนาด จำกัดจำนวนและอัตรา upload พร้อมแยก private storage; หากรองรับ PDF ต้องกำหนดชัด

ตรวจซ้ำ: HTML ปลอม extension, SVG, รูปเสีย, ไฟล์เกินขนาด และ upload ซ้ำต้องถูกจัดการโดยไม่ 500

### WT-13 — P1 — expiry พึ่ง task ครั้งเดียว ไม่มีการกู้รายการหมดอายุที่หลุด

หลักฐาน: [backend/apps/bookings/tasks.py:23](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/tasks.py:23>), [backend/apps/bookings/tasks.py:49](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/tasks.py:49>), [backend/apps/bookings/services.py:335](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:335>)

ยืนยันจากโค้ด: task ที่มาถึงก่อนเวลาจะ return โดยไม่ reschedule; ไม่พบ periodic reconciliation/retry สำหรับรายการค้าง และ publish task อยู่ในเส้นทาง transaction ก่อน commit

ผลกระทบขึ้นกับ runtime: eager mode อาจรันทันทีแล้วไม่ปล่อย stock ภายหลัง; broker/worker ขัดข้องหรือ task หายทำให้ holds ค้าง เอกสารระบุ Redis/worker ยังต้องจัดเตรียม แต่ไม่ได้ตรวจสถานะ service จริงในรอบนี้

แก้: ส่งหลัง commit พร้อมกลไกส่งซ้ำที่เชื่อถือได้และ sweeper หา expired holds; แก้ early execution ให้กลับมาทำงานเมื่อถึงเวลา

ตรวจซ้ำ: eager/dev, worker restart, task เร็ว/ช้า/ซ้ำ, broker failure ต้องคืน stock เพียงครั้งเดียวและไม่มี booking ค้างถาวร

### WT-14 — P1 — สลิปที่ส่งทันเวลาอาจหมดอายุระหว่างรอตรวจ

หลักฐาน: [backend/apps/bookings/tasks.py:45](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/tasks.py:45>), [backend/apps/payments/services.py:159](</Users/tanchonl/Documents/welltrip/backend/apps/payments/services.py:159>)

ยืนยัน lifecycle จากโค้ด: upload ทำให้ slip เป็น PENDING_CHECK แต่ booking ยัง AWAITING_PAYMENT จึงถูก expiry ยกเลิกได้ และ verify ปฏิเสธ booking ที่ expired

ตัวอย่าง: โอนและส่งนาที 14 แต่ provider ตรวจหลังนาที 15 → stock คืนและไม่ยืนยันการจอง ทั้งที่เงินอาจเข้าจริง

แก้: กำหนดนโยบาย cutoff ของการโอน/ส่ง/ตรวจ พร้อม bounded review grace และ recovery/refund สำหรับเงินที่รับแล้ว ห้ามหยุด expiry ไม่มีกำหนดเพียงเพราะมีไฟล์ซึ่งผู้ใช้ปลอมได้

ตรวจซ้ำ: upload/verify/expiry ชนกันก่อนและหลังเส้นตาย ต้องไม่มีเงินรับแล้วสูญหายจากกระบวนการติดตาม

### WT-15 — P1 — สัญญา verify_slip ยังไม่บังคับตรวจผู้รับเงินและกรอบเวลาครบ

หลักฐาน: [backend/apps/payments/services.py:99](</Users/tanchonl/Documents/welltrip/backend/apps/payments/services.py:99>), [backend/apps/payments/services.py:211](</Users/tanchonl/Documents/welltrip/backend/apps/payments/services.py:211>)

ข้อบกพร่องแฝงก่อนเชื่อม provider: contract ระบุยอด/ref/time/sender แต่ไม่กำหนดผู้รับเงิน และกฎตรวจไม่ครอบคลุม upper bound ตาม expires_at

ผลกระทบ: หาก adapter ไม่ตรวจผู้รับเอง สลิปยอดตรงแต่โอนไปผิดบัญชีอาจผ่าน business rules; ปัจจุบัน provider ยังไม่เชื่อม จึงไม่ใช่หลักฐานว่ามี public endpoint ยืนยันสลิปปลอมได้แล้ว

แก้: บังคับ verified receiver identity, currency, เวลา timezone-aware และ cutoff ใน contract รวม duplicate reference ที่เป็น atomic

ตรวจซ้ำ: ยอดตรงแต่ผู้รับผิด, สลิปก่อนสร้าง booking/หลังเส้นตาย, reference ซ้ำพร้อมกัน ต้องไม่ confirm

### WT-16 — P2 — checkout ไม่มี idempotency สำหรับการส่งซ้ำ

หลักฐาน: [backend/apps/bookings/views.py:1](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/views.py:1>), [backend/apps/bookings/services.py:1](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:1>), [frontend/src/app/(mobile-tourist)/checkout/page.tsx:142](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/page.tsx:142>)

ยืนยันจากโค้ด: POST ใหม่สร้าง booking/payment ใหม่ ไม่มี key ผูกกับ checkout attempt

ผลกระทบ: เมื่อ server commit แล้ว response timeout ผู้ใช้ retry อาจสร้างการจองและ holds ซ้ำ การ lock stock ไม่ได้ป้องกัน duplicate order ที่ยังมี stock พอ

แก้: idempotency key ต่อผู้ใช้/attempt และตรวจ payload เดิม คืนผลเดิมเมื่อ retry

ตรวจซ้ำ: ส่ง key เดิมพร้อมกันและหลัง timeout ต้องได้ booking/payment เดิม; payload ต่างแต่ key เดิมต้อง conflict

### WT-17 — P2 — ความยาวค่าที่สร้างต่อจาก input อาจเกินคอลัมน์ DB

หลักฐาน: [backend/apps/otop/models.py:71](</Users/tanchonl/Documents/welltrip/backend/apps/otop/models.py:71>), [backend/apps/accommodations/models.py:1](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/models.py:1>), [backend/apps/bookings/services.py:169](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:169>), [backend/apps/bookings/models.py:1](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/models.py:1>)

ยืนยันจากโครงสร้าง: SKU/slug เติม suffix ต่อชื่อโดยไม่มี budget ที่สอดคล้องกับ max_length; snapshot ชื่อห้องรวมชื่อที่พัก + ชื่อห้อง แต่ entity_name ใน BookingItem สั้นกว่าผลรวมที่ input อนุญาต

ผลกระทบ: ข้อมูลที่ผ่าน serializer อาจสร้างหรือ checkout แล้วชน DataError/500 บน PostgreSQL เช่นชื่อ ASCII ยาวใกล้เพดาน

แก้: ตัดส่วนฐานให้เหลือพื้นที่ suffix และออกแบบ snapshot field ให้รองรับชื่อรวม พร้อม validation ที่ชัด

ตรวจซ้ำ: ชื่อไทย/ASCII ที่ขอบ max length รวมชื่อที่พักและห้องยาวพร้อมกัน ต้องไม่ 500

### WT-18 — P2 — ขอบเขตตัวเลขยังไม่ครอบคลุมยอดรวมและค่าที่ไม่ finite

หลักฐาน: [backend/apps/bookings/serializers.py:1](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/serializers.py:1>), [backend/apps/bookings/services.py:310](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/services.py:310>), [backend/apps/otop/views.py:37](</Users/tanchonl/Documents/welltrip/backend/apps/otop/views.py:37>), [backend/apps/accommodations/views.py:84](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/views.py:84>)

ยืนยัน validation gap; exception จริงต้องทดสอบ runtime: quantity บางช่องมีเพียงค่าต่ำสุด ทำให้ยอดรวมเกิน Decimal(10,2) ได้; parser ตัวกรองราคาใช้ Decimal โดยไม่ reject NaN/Infinity

ผลกระทบ: input ที่รูปแบบแปลงได้อาจไปล้มที่ ORM/DB แทน 400; stock delta ขนาดใหญ่ก็ต้องตรวจ integer budget

แก้: กำหนด quantity/stock/ยอดสูงสุด ตรวจ is_finite และตรวจผลคูณ/ผลรวมก่อนเขียน DB

ตรวจซ้ำ: NaN, Infinity, จำนวนและยอดเกินเพดาน รวม boundary ที่ยังอนุญาต ต้องได้ error ที่สม่ำเสมอ

### WT-19 — P2 — filter จำนวนแขกและห้องว่างอาจตรงคนละห้อง

หลักฐาน: [backend/apps/accommodations/views.py:163](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/views.py:163>), [backend/apps/accommodations/views.py:203](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/views.py:203>), [frontend/src/app/(mobile-tourist)/hotels/page.tsx:211](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/hotels/page.tsx:211>), [frontend/src/app/(mobile-tourist)/hotels/[id]/page.tsx:46](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/hotels/[id]/page.tsx:46>)

ยืนยันจากโค้ด: เงื่อนไข capacity ตรวจว่ามีห้องรองรับ แต่ขั้นตรวจ availability วนห้อง active โดยไม่ได้บังคับ capacity เดิม

ตัวอย่าง: ห้อง 4 คนเต็ม แต่ห้อง 2 คนว่าง ที่พักยังอาจปรากฏเมื่อค้น 4 คน นอกจากนี้ลิงก์ไป detail ไม่ส่ง dates/guests ต่อ ทำให้ต้องเลือกใหม่

แก้: ใช้ชุดห้องเดียวกันสำหรับ capacity และ availability ส่งเงื่อนไขค้นหาไป detail และตรวจซ้ำฝั่ง server

ตรวจซ้ำ: scenario ข้างต้นต้องไม่เสนอห้องผิดขนาด และเปิด detail ต้องคงวัน/จำนวนแขก

### WT-20 — P2 — cart แยกห้องตามวันตอนเพิ่ม แต่ลบ/แก้จำนวนไม่แยกวัน

หลักฐาน: [frontend/src/store/cart-store.ts:77](</Users/tanchonl/Documents/welltrip/frontend/src/store/cart-store.ts:77>), [frontend/src/store/cart-store.ts:144](</Users/tanchonl/Documents/welltrip/frontend/src/store/cart-store.ts:144>), [frontend/src/store/cart-store.ts:164](</Users/tanchonl/Documents/welltrip/frontend/src/store/cart-store.ts:164>), [frontend/src/app/(mobile-tourist)/checkout/page.tsx:91](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/page.tsx:91>)

ยืนยันจากโค้ด: dedupe ตอน add ใช้วันเข้าพัก แต่ remove/update ใช้ entity type + id เท่านั้น; key ในรายการ checkout ก็ไม่แยกวัน

ผลกระทบ: เพิ่มห้องเดียวกันสองช่วงวันแล้วแก้หรือลบรายการหนึ่งอาจกระทบทั้งคู่ และหน้าสรุปไม่แสดงวันให้แยกชัด เอกสารเคยสมมติหนึ่งช่วงพัก แต่ UI ปัจจุบันเพิ่มหลายช่วงได้

แก้: ใช้ cart line id หรือ composite key เดียวกันทุก operation/render พร้อมแสดงวัน; กำหนดนโยบาย cart ค้างข้าม logout ด้วย เพราะ wt_cart ยังเก็บอยู่

ตรวจซ้ำ: ห้องเดียวสองช่วงวันต้องเพิ่ม/ลด/ลบแยกกัน และสลับผู้ใช้ต้องไม่มีรายการเก่าถูกสั่งโดยไม่ตั้งใจ

### WT-21 — P2 — หน้าชำระเงินบอกว่าส่งสลิปแล้วทั้งที่ยังไม่ได้ส่ง

หลักฐาน: [frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:238](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:238>)

ยืนยันจาก JSX: ข้อความ slipUploaded/pending แสดงโดยไม่มีเงื่อนไขว่ามีสลิปหรือ upload สำเร็จ

ผลกระทบ: ผู้ใช้ที่ยังไม่แนบหรือ upload ล้มเหลวเข้าใจว่าส่งแล้วและรอจนหมดเวลา

แก้และตรวจซ้ำ: แยก empty/uploading/submitted/rejected ให้ใช้ผล server; เปิด payment ใหม่และจำลอง upload fail ต้องไม่มีข้อความส่งแล้ว

### WT-22 — P2 — payment UI ยังเปิดให้ส่งใน FAILED และเมื่อ countdown เป็นศูนย์

หลักฐาน: [frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:61](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:61>), [frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:166](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:166>), [frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:208](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:208>), [backend/apps/payments/serializers.py:48](</Users/tanchonl/Documents/welltrip/backend/apps/payments/serializers.py:48>)

ยืนยันจากโค้ด: UI แยก success/expired แต่ไม่จัด FAILED ครบ; countdown ไม่ได้เป็นตัวปิด action ทุกกรณี และ detail contract ยังไม่ช่วย restore เส้นตายได้ครบใน deep link

ผลกระทบ: ยังเห็นบัญชีโอน/ปุ่มส่งทั้งที่ backend ปฏิเสธ หรือ timer ไม่ตรงสถานะจริง; ไม่ใช่หลักฐานว่า backend รับ payment หลังปิดแล้ว

แก้: ใช้ state machine และ expires_at จาก server อนุญาต upload เฉพาะสถานะที่รองรับ หยุด timer เมื่อสถานะสิ้นสุด

ตรวจซ้ำ: deep link/reload ทุก payment status, เวลาเป็นศูนย์, เปลี่ยนสถานะระหว่างเปิดหน้า

### WT-23 — P2 — ล้างราคา override ใน portal แล้วค่าเดิมยังอยู่

หลักฐาน: [frontend/src/app/(portal)/portal/homestay/page.tsx:51](</Users/tanchonl/Documents/welltrip/frontend/src/app/(portal)/portal/homestay/page.tsx:51>), [frontend/src/app/(portal)/portal/homestay/page.tsx:60](</Users/tanchonl/Documents/welltrip/frontend/src/app/(portal)/portal/homestay/page.tsx:60>), [backend/apps/accommodations/serializers.py:150](</Users/tanchonl/Documents/welltrip/backend/apps/accommodations/serializers.py:150>)

ยืนยันจากโค้ด: ช่องราคาว่างทำให้ omit field และถ้าทั้งสองช่องว่างจะไม่ส่ง แต่ API ต้องรับ price_override:null เพื่อล้างราคา

ผลกระทบ: UI สื่อว่าลบราคาเพื่อยกเลิกได้ แต่ราคาพิเศษยังถูกคิดจริง อีกจุดคือข้อความ pending save สื่อเหมือนบันทึกสำเร็จแล้ว

แก้และตรวจซ้ำ: แยก unchanged/set/clear อย่างชัดเจน ส่ง null เมื่อผู้ใช้เลือก clear และแสดง success หลัง server สำเร็จ; ตั้ง override → ล้าง → reload → checkout ต้องกลับราคา base

### WT-24 — P2 — รายการจองและ portal จำกัด 50 รายการโดยไม่มี pagination UI

หลักฐาน: [frontend/src/app/(mobile-tourist)/my-bookings/page.tsx:47](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/my-bookings/page.tsx:47>), [frontend/src/app/(portal)/portal/homestay/page.tsx:1](</Users/tanchonl/Documents/welltrip/frontend/src/app/(portal)/portal/homestay/page.tsx:1>), [frontend/src/app/(portal)/portal/restaurant/page.tsx:1](</Users/tanchonl/Documents/welltrip/frontend/src/app/(portal)/portal/restaurant/page.tsx:1>), [frontend/src/app/(portal)/portal/wellness/page.tsx:1](</Users/tanchonl/Documents/welltrip/frontend/src/app/(portal)/portal/wellness/page.tsx:1>), [frontend/src/app/(portal)/portal/otop/page.tsx:1](</Users/tanchonl/Documents/welltrip/frontend/src/app/(portal)/portal/otop/page.tsx:1>)

ยืนยันจากโค้ด: fetch หน้าแรก limit 50 แต่ไม่มี next page/load more

ผลกระทบ: ข้อมูลรายการที่ 51 เป็นต้นไปเข้าถึงไม่ได้จากหน้าจอ โดยเฉพาะ portal ที่ยังใช้ public catalog จึงมีปัญหาเลือกทรัพยากรของตนเพิ่มขึ้น

แก้และตรวจซ้ำ: pagination/infinite query ใช้ next/count จริง; seed มากกว่า 50 และตรวจว่าเข้าถึงได้ครบโดยไม่ซ้ำ

### WT-25 — P2 — route ฝั่ง client ตรวจ session/role ไม่ครบ

หลักฐาน: [frontend/src/app/(mobile-tourist)/my-bookings/page.tsx:39](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/my-bookings/page.tsx:39>), [frontend/src/app/(mobile-tourist)/checkout/page.tsx:33](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/page.tsx:33>), [frontend/src/app/(portal)/portal/layout.tsx:85](</Users/tanchonl/Documents/welltrip/frontend/src/app/(portal)/portal/layout.tsx:85>)

ยืนยันจากโค้ด: private query บางหน้าเริ่มโดยไม่รอ auth hydration; checkout ตรวจ login แต่ไม่ตัด role ที่ backend ไม่อนุญาต; portal layout ตรวจว่ามี module ใดก็พอ ไม่ตรวจสิทธิ์ module ของ pathname

ผลกระทบ: guest/reload ได้ error แทน flow login, vendor ไป checkout แล้ว 403, vendor เข้า URL module อื่นเห็น form ที่ส่งไม่ผ่าน Backend ยังตรวจ role/owner จึงไม่จัดเป็น server authorization bypass

แก้และตรวจซ้ำ: gate query ด้วย auth readiness, route role และ return URL; ทดสอบ guest/tourist/vendor ทุก role ทั้งกดลิงก์และเปิด URL ตรง

### WT-26 — P2 — production STORAGES ไม่มี default สำหรับไฟล์อัปโหลด

หลักฐาน: [backend/core/settings/production.py:26](</Users/tanchonl/Documents/welltrip/backend/core/settings/production.py:26>), [backend/core/settings/base.py:55](</Users/tanchonl/Documents/welltrip/backend/core/settings/base.py:55>)

ยืนยันจาก config: STORAGES ประกาศเฉพาะ staticfiles ทำให้ไม่มี alias default ที่ FileField ใช้ เมื่อเลือก production settings เส้นทาง upload เสี่ยง InvalidStorageError

นอกจากนี้เลือก WhiteNoise storage แต่ไม่พบ WhiteNoise middleware ใน base; การเสิร์ฟ static จึงต้องมี proxy/service อื่นซึ่งยังไม่ยืนยัน

แก้: เพิ่ม default private storage สำหรับ media และกำหนด static serving/deploy settings ให้ครบ

ตรวจซ้ำ: ใช้ production settings จริง upload/read สลิปแบบมีสิทธิ์ และเปิด static assets ผ่านเส้นทาง deploy จริง ไม่ถือว่า dev upload ผ่านแล้ว production ผ่าน

### WT-27 — P2 — 500 response เปิดเผยข้อความ exception ภายใน

หลักฐาน: [backend/common/exceptions.py:38](</Users/tanchonl/Documents/welltrip/backend/common/exceptions.py:38>)

ยืนยันจากโค้ด: unhandled exception ส่ง str(exc) กลับผู้เรียก

ผลกระทบ: อาจเผยชื่อคอลัมน์ ตาราง path หรือรายละเอียดโครงสร้างจาก DB/ไลบรารี โดยเฉพาะเมื่อกระตุ้น input edge case ในข้ออื่น

แก้และตรวจซ้ำ: production ส่งข้อความทั่วไปและ request id เก็บรายละเอียดใน server log ที่ควบคุมสิทธิ์; บังคับ exception ตัวอย่างแล้ว response ต้องไม่เปิดข้อมูลภายใน

### WT-28 — P2 — ยังไม่มี rate limit สำหรับ auth/upload/การถือ stock

หลักฐาน: [backend/core/settings/base.py:123](</Users/tanchonl/Documents/welltrip/backend/core/settings/base.py:123>), [backend/apps/authentication/views.py:1](</Users/tanchonl/Documents/welltrip/backend/apps/authentication/views.py:1>), [backend/apps/bookings/views.py:1](</Users/tanchonl/Documents/welltrip/backend/apps/bookings/views.py:1>)

ยืนยันเฉพาะ application code: ไม่พบ DRF throttle/rate limit สำหรับเส้นทางเหล่านี้ ยังไม่ทราบว่ามี edge/WAF ภายนอกหรือไม่

ผลกระทบ: เดารหัส/สร้างบัญชี/upload ซ้ำได้ง่ายขึ้น และสร้าง checkout เพื่อกัก stock โดยไม่ชำระได้

แก้: rate limit ตาม endpoint/IP/account และเพดาน active holds พร้อมนโยบายยกเว้นที่เหมาะสม

ตรวจซ้ำ: request เกินเกณฑ์ได้ 429/ข้อจำกัดที่ชัด และไม่ทำให้ลูกค้าหลายรายหลัง NAT ถูกล็อกเกินเหตุ

### WT-29 — P2 — วันที่แบบ calendar อาจแสดงย้อนหลังหนึ่งวันใน timezone ตะวันตก

หลักฐาน: [frontend/src/lib/format.ts:61](</Users/tanchonl/Documents/welltrip/frontend/src/lib/format.ts:61>)

ยืนยันจาก JavaScript date semantics: new Date('YYYY-MM-DD') เป็น UTC แต่ format ตาม timezone เครื่อง ทำให้บางพื้นที่เห็นวันก่อนหน้า

ผลกระทบ: วันพัก/วันบริการแสดงไม่ตรงข้อมูลแม้ server เก็บถูก

แก้และตรวจซ้ำ: แยก calendar date ออกจาก timestamp และกำหนด timezone ตามชนิดข้อมูล; เปรียบเทียบ Asia/Bangkok, UTC และ America/Los_Angeles ต้องได้วันพักเดียวกัน

### WT-30 — P3 — หน้าแรกและ accessibility ยังมีทางตัน/ข้อมูลสื่อเกินความพร้อม

หลักฐาน: [frontend/src/app/(mobile-tourist)/home/page.tsx:30](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/home/page.tsx:30>), [frontend/src/app/(mobile-tourist)/home/page.tsx:93](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/home/page.tsx:93>), [frontend/src/app/(mobile-tourist)/home/page.tsx:113](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/home/page.tsx:113>), [frontend/src/app/layout.tsx:33](</Users/tanchonl/Documents/welltrip/frontend/src/app/layout.tsx:33>), [frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:213](</Users/tanchonl/Documents/welltrip/frontend/src/app/(mobile-tourist)/checkout/payment/[paymentId]/page.tsx:213>)

ยืนยันจาก markup: service cards มี href ในข้อมูลแต่ render เป็น div ที่ไม่เชื่อมทางไป; ปุ่มกระดิ่งไม่มี action; html lang เป็น en ขณะที่หน้าเริ่มภาษาไทย; file input ถูก hidden และ label ไม่มี keyboard interaction ที่เทียบเท่าปุ่ม

พบข้อความบางส่วนยังเป็นอังกฤษและ UI บางจุดใช้ link ครอบ button รวมถึง touch target ต่ำกว่า 44px ตามข้อกำหนด โครง portal บนจอใหญ่ยังควรตรวจภาพจริงเพราะ shell แคบร่วมกับ sidebar

แก้: ต่อ navigation/แจ้งสถานะ feature ที่ยังไม่พร้อม ใช้ semantic controls, lang/i18n และ focus ที่ถูกต้อง ปรับข้อความยืนยัน/ชำระทันทีให้ตรง lifecycle จริง

ตรวจซ้ำ: keyboard-only, screen reader, mobile 390/430px และ desktop; ข้อนี้ยังไม่ได้ visual QA บน browser

## งานที่ยังไม่ครบตามแผน แยกจากบั๊กข้างต้น

เอกสาร master/C12 ระบุข้อจำกัดหลายข้อไว้แล้ว จึงไม่ตีความทั้งหมดเป็น regression ใหม่ แต่ข้อจำกัดเหล่านี้ยังขวางการใช้งานจริงได้

| งานค้าง | ผลต่อผู้ใช้/การเปิดระบบ | เกณฑ์รับงาน |
|---|---|---|
| Vendor-scoped GET/PATCH และ incoming orders | portal ยังไม่ได้เป็นเครื่องมือบริหารธุรกิจครบวงจร; public list ไม่ได้ระบุ owner ตามการออกแบบ | vendor เห็น/แก้เฉพาะทรัพยากรของตนและเห็นคำสั่งซื้อที่เกี่ยวข้อง ทดสอบ cross-owner |
| Payee/bank configuration | ยังไม่มีข้อมูลรับเงินจริงที่พร้อมให้ผู้ใช้โอน | server ส่งข้อมูลผู้รับที่ตรวจสอบได้ตรงกับ provider ห้ามให้ผู้ใช้โอนจาก placeholder |
| Slip provider และ orchestration | upload เป็น PENDING_CHECK เป็นพฤติกรรมที่ตั้งใจ ไม่ใช่หลักฐานว่าเงินผ่านแล้ว | เชื่อม provider, timeout/retry, duplicate, receiver/time checks และ reconciliation |
| Google OAuth config | ปุ่มมีโค้ดแต่ความพร้อมจริงขึ้นกับ client IDs/redirect | ทดสอบ client/server IDs และ origin/redirect จริงหลังแก้ข้อ 01–04 |
| Redis/Celery worker และ expiry operations | ถือ stock 15 นาทีไม่ได้รับประกันด้วยโค้ด task อย่างเดียว | worker monitoring, recovery/sweeper และทดสอบ restart/failure |
| Password reset/email verification/profile editing | manual account ยังไม่มี lifecycle จัดการบัญชีครบ | ส่ง verification/recovery อย่างปลอดภัย และกำหนดการเปลี่ยนอีเมล/รหัส |
| Server-side logout/session revocation | logout ปัจจุบันล้าง client แต่ไม่ได้ revoke refresh token ฝั่ง server | logout/revoke ที่ทดสอบได้; ตัดสินใจ httpOnly cookie แทน refresh token ใน localStorage พร้อมออกแบบ CSRF |
| Notification/FCM | กระดิ่งและการแจ้งสถานะยังไม่ใช่ notification flow สมบูรณ์ | permission, device registration และ event delivery ที่ตรวจสอบได้ |
| Automated/E2E regression | ผลเก่าในเอกสารไม่ยืนยัน source ปัจจุบัน | รันชุดตรวจที่ระบุด้านล่างบน test environment ที่ผู้ใช้อนุญาต |

ข้อสังเกตเพิ่มเติมที่ควรติดตาม: permission class IsSuperAdmin มีเงื่อนไข admin_can_impersonate ที่คืน false ในโค้ดปัจจุบัน แต่ยังไม่พบเส้นทางใช้งานจึงไม่จัดเป็นบั๊ก active route; การปิดบัญชี vendor ยังต้องกำหนดว่าจะปิดสินค้า/บริการที่ active อยู่ด้วยหรือไม่; booking code สุ่มและชื่อที่สร้างควรมี collision retry; cart เพิ่มจำนวนเกิน stock ได้ใน UI แม้ backend ปฏิเสธถูกต้อง ควรปรับข้อความและจำนวนที่เลือกได้

## ส่วนที่มีการป้องกันอยู่แล้ว

- Backend ตรวจ role/owner ในเส้นทาง mutation สำคัญและกรอง booking/payment ตามผู้ใช้ จึงไม่จัดปัญหา route gate หรือ public catalog เป็นการข้ามสิทธิ์ backend โดยอัตโนมัติ
- Checkout ใช้ transaction และ row locking ในเส้นทาง stock หลัก การตรวจนี้ไม่ได้พบว่าคำขอ checkout ปกติทุกชนิดขายเกินได้; ข้อ 07 และ 08 ระบุเส้นทางที่ทำลาย invariant แยกต่างหาก
- Expiry มี status guard ช่วยป้องกันคืน stock ซ้ำ และ verify/expiry จัด lock booking ก่อน child rows แต่ยังต้องมี recovery และนโยบาย review
- Google ตรวจ signature/audience และ verified email อยู่แล้ว ข้อ 02–03 เกี่ยวกับการผูกบัญชีและผูก login attempt ไม่ใช่การยอมรับ token ใดก็ได้
- ราคา snapshot และการคำนวณเงินฝั่ง server เป็นทิศทางที่ถูกต้อง แต่ต้องปิดช่อง input และยอดรวมตามข้อ 06/17/18

## ลำดับแก้ที่แนะนำ

1. แก้ auth response contract แล้วตรวจสมัคร/login/refresh/Google; ปิด account linking/callback และ private cache ไปด้วยก่อนถือว่า auth พร้อม
2. ป้องกันราคาผิดและ stock เสีย: price constraints, availability model, wellness locking, past-date และ request limits
3. ทำ payment พร้อมจริง: private upload, file limits, receiver verification, expiry/review/recovery และ payee config พร้อมแก้ข้อความ UI
4. แก้ checkout idempotency, cart identity, validation boundaries และ search correctness
5. เติม vendor API/หน้า portal, pagination และ route gates; จบด้วย production config และ UX/accessibility

## ชุดตรวจรับที่ต้องทำก่อนเปิดจริง

ยังไม่ได้รันรายการเหล่านี้ รายการนี้เป็นเกณฑ์สำหรับรอบทดสอบภายใต้กติกาโครงการ

| ชุด | กรณีจำเป็น | ผ่านเมื่อ |
|---|---|---|
| Auth | สมัครใหม่/ซ้ำ, รหัสผิด, inactive, reload, token expiry, logout, Google callback ผิด | session ถูกต้องและไม่มี credential/cached data ข้ามบัญชี |
| Authorization | guest/tourist/vendor ทุก role, ID ของคนอื่น, URL ตรง | อ่าน/เขียนได้ตามสิทธิ์เท่านั้น รวม direct media URL |
| Room stock | concurrent checkout, owner update, expiry ซ้ำ/ชน verify | ไม่มี oversell/stock ติดลบหรือเปิดขายคืนผิดเจตนา |
| Wellness | overlapping creates พร้อมกัน, booking พร้อมกัน, slot อดีต | ไม่สร้างช่วงซ้อนหรือรับเกินและไม่จองย้อนหลัง |
| Money | negative/zero/large prices, quantities สูง, cart ผสม | ยอดตรงเป็น Decimal, error 400/409 ที่ชัด ไม่มี 500 |
| Checkout retry | commit แล้ว timeout, double submit, key ซ้ำ | booking/payment เดียวต่อ attempt |
| Payment | no slip, upload fail, wrong receiver/amount/time, duplicate ref | UI ตรง server และ confirm เฉพาะเงินที่ตรวจผ่าน |
| Expiry | broker fail, early task, worker restart, late verification | คืน stock ครั้งเดียว และเงินที่รับแล้วมี recovery |
| Data/UI | 51+ records, สองช่วงวันห้องเดียว, timezone, keyboard/mobile | เข้าถึงข้อมูลครบและแสดงวัน/สถานะถูกต้อง |
| Production | settings จริง, storage private, static serving, sanitized 500 | ทำงานใน deployment จริงและไม่เปิดรายละเอียดภายใน |

## ข้อสรุปการตรวจ

โครงการมีแกนระบบและการตรวจสิทธิ์หลายส่วนแล้ว แต่ยังมีบั๊กข้าม frontend/backend และเงื่อนไขธุรกรรมที่สำคัญ สถานะ “Phase 1 เสร็จ” ในเอกสารจึงไม่เท่ากับพร้อมเปิดรับเงินจริง รายงานนี้ให้หลักฐานและลำดับแก้จาก source ปัจจุบัน การปิดประเด็นต้องใช้ผลทดสอบจริงตามกรณีข้างต้น ไม่ใช่เพียงแก้ข้อความหรือยืนยันจากเอกสารเดิม
