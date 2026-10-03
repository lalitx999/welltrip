# WellTrip — Phase 1 Remaining Summary (Master Handover)

> **ประเภทเอกสาร:** Deliverable สุดท้ายของ Phase 1 — สำหรับ AI ตัวถัดไป / ผู้ร่วมทีม อ่านแล้วต่องานได้ทันที
> **อัปเดต:** 2026-09-09
> **อ่านก่อนเสมอ (NO MAGIC):** `docs/C1.md` (Auth) `docs/C2.md` (Models+Services) `docs/C3.md` (Plan รวม) `docs/C4.md` (Step 3–4 backend) `docs/C5.md` (Plan FE) `docs/C6.md` (FE M1) `docs/C7.md` (FE M2) `docs/C8.md` (FE M3) `docs/C9.md` (FE M4 + UI revision) `docs/C10.md` (FE M5) `docs/C11.md` (FE M6) `docs/C12.md` (FE M7 Portal) แล้วค่อยอ่านโค้ดจริงตาม File Map ในไฟล์นี้

---

## 1. สถานะรวม (verified 2026-09-09)

| ส่วน | สถานะ | หลักฐาน |
|---|---|---|
| Auth & User Mgmt (backend) | ✅ | C1, test 10/10 |
| Step 1: Models (5 apps) + migrate | ✅ | C2 |
| Step 2: Business logic (`services.py`) | ✅ | C2, smoke ผ่าน |
| Step 3: Serializers/Views/URLs (7 slices) | ✅ | C4, smoke **75/75** |
| Step 4: Celery + 15-min expiry worker | ✅ | C4 §11, test **12/12** |
| FE Module 1: Types + API layer | ✅ | C6, typecheck ผ่าน |
| FE Module 2: Cart Store | ✅ | C7, typecheck ผ่าน |
| FE Module 3: Shell + BottomNav + `/home` | ✅ | C8, typecheck ผ่าน |
| FE Module 4: Discovery/Catalog + UI mock + Unsplash | ✅ user ตรวจผ่าน (2026-09-09) | C9 |
| FE Module 5: Cart/Checkout/Payment | ✅ user ตรวจผ่าน (2026-09-09) | C10 |
| FE Module 6: My Bookings + Profile | ✅ user ตรวจผ่าน (2026-09-09) | C11 |
| **FE Module 7: Vendor Portal** | ✅ user ตรวจผ่าน (2026-09-09) | C12 |
| **`phase1-remaining-summary.md`** (ไฟล์นี้) | ✅ ปิดงาน Phase 1 | — |

> ✅ **Phase 1 จบแล้ว (user ยืนยัน 2026-09-09)** — งานเขียนโค้ดครบทุก Module, typecheck ผ่านหลังแก้ 3 จุดท้าย (messages.ts syntax, clear .next cache, google-button hydration — รายละเอียด §11)


---

## 2. Endpoint Matrix (จากโค้ดจริง backend — อย่าเดา)

> ทุก response ผ่าน envelope มาตรฐาน (ดู §3); ระบบ pagination = PageNumber (`?page=1&limit=20`, max 100) → `meta.pagination`

### 2.1 Auth (ดู C1)
`POST /api/v1/auth/register/`, `POST /api/v1/auth/login/`, `POST /api/v1/auth/refresh/`, `POST /api/v1/auth/oauth/google/`

### 2.2 Public (AllowAny — ไม่ต้อง login)
| Method | Path | Query / หมายเหตุ |
|---|---|---|
| GET | `/api/v1/accommodations/` | `province`, `checkin`+`checkout` (คู่กัน), `guests`, `min_price`, `max_price`, `page`, `limit` |
| GET | `/api/v1/accommodations/{uuid}/rooms/` | `checkin`+`checkout` (optional; ส่งแล้ว response มี availability/ราคา) — **data = `{accommodation, rooms[]}`** |
| GET | `/api/v1/foods/` | `category` (comma list), `max_calorie`, page/limit — คืนเฉพาะ `is_available=True` |
| GET | `/api/v1/wellness/` | page/limit — คืนเฉพาะ `is_active=True` |
| GET | `/api/v1/wellness/{uuid}/slots/` | `date=YYYY-MM-DD` **required** — **data = `{wellness_service, slots[]}`**; slot.id = INT |
| GET | `/api/v1/otop/` | `category` (comma), `search`, `min_price`, `max_price`, page/limit |

### 2.3 Vendor actions (ต้อง login; ownership + SUPER_ADMIN ทะลุได้)
| Method | Path | Body |
|---|---|---|
| POST | `/api/v1/accommodations/rooms/{uuid}/pricing/` | `{date, price_override?, available_count?}` (อย่างน้อย 1 field) |
| POST | `/api/v1/wellness/{uuid}/slots/` | `{date, start_time, end_time, capacity?}` |
| POST | `/api/v1/otop/{uuid}/stock/` | `{delta}` (signed int, ห้าม 0) |
| POST | `/api/v1/accommodations/`, `/{id}/rooms/`, `/api/v1/foods/`, `/api/v1/wellness/`, `/api/v1/otop/` | create ของ vendor (ยังไม่มี GET เฉพาะเจ้าของ!) |

### 2.4 Tourist / เจ้าของ booking (money flow — TOURIST เท่านั้น, SUPER_ADMIN ไม่ทะลุ)
| Method | Path | Body / หมายเหตุ |
|---|---|---|
| POST | `/api/v1/bookings/checkout/` | **body = array** ของ `{item_type, entity_id, quantity, checkin_date?, checkout_date?}` — `entity_id`: wellness = **int**, อื่น = **UUID string** |
| GET | `/api/v1/bookings/my-orders/` | `status=active|completed|cancelled` (cancelled รวม PAYMENT_EXPIRED) |
| GET | `/api/v1/bookings/{uuid}/` | detail: items snapshot + payment summary |
| GET | `/api/v1/payments/{uuid}/` | payment detail + payee + slips (**ไม่มี expires_at**) |
| POST | `/api/v1/payments/slips/upload/` | **multipart** `payment_id` + `image` → slip เก็บเป็น `PENDING_CHECK` |

### 2.5 Response envelope ตัวอย่าง
```
// success (list)
{ "success": true, "data": [ ... ], "message": "...",
  "meta": { "pagination": { "page":1, "limit":20, "total_items":0, "total_pages":1 } } }
// success (object เช่น rooms/slots/payment/booking)
{ "success": true, "data": { ... }, "message": "..." }
// error
{ "success": false, "error": { "code": "ROOM_UNAVAILABLE", "details": null }, "message": "..." }
```
`checkout` 201 คืน data: `{booking_id, booking_code, status, total_subtotal, platform_fee, net_amount, expires_at, payment_id, payment_channel}`

---

## 3. DB Schema ที่ต่างจาก spec เดิม (สำคัญ — อย่าเผลอไปตาม spec เก่า)

1. **Payment = Slip Check ล้วน** (เลิก Omise/EMVCo QR): `Payment.channel=BANK_TRANSFER`, `payee_account_number/name/bank` เป็น snapshot (ตอนนี้ `""`), มี `PaymentSlip` (image, `status` PENDING_CHECK/VERIFIED/REJECTED, partial unique index กันใช้สลิปซ้ำตอน VERIFIED)
2. **`BookingItem.entity_id` = `CharField(36)`** ไม่ใช่ UUIDField/FK — เก็บ canonical string เพราะ PK ต่างชนิด: room/food/otop = UUID, **wellness slot = int (BIGSERIAL)**. ตอน query ต้อง cast ตาม `item_type` (UUID vs int)
3. `Booking` มี `booking_code` (WT-YYYYMMDD-XXXXXX), `expires_at` = now+15 นาที, TTL 15 นาที
4. `platform_fee = 0` (ยังไม่มีนโยบาย fee)
5. Inventory semantics: แถว calendar/slot/capacity = "ของเหลือจริง"; row ไม่มี = เต็ม (เท่ากับ total)

---

## 4. การตัดสินใจ + WHY (ที่ตกลงกับ user แล้ว — อย่าเปลี่ยนโดยไม่ถาม)

1. **Frontend ไม่แตะ auth files เดิม** ที่ผ่าน review (C5 §5): `auth-api.ts`, `api-client.ts`, `token-manager.ts`, `use-auth.tsx`, `auth-store.ts` → ถ้าจำเป็นต้องแก้ ถามก่อน
2. **Cart จัดกลุ่มตามหมวด (item_type)** เพราะ public serializers ยังไม่มี vendor field (Q3) — `groupedByVendor` เลื่อนไปเมื่อ backend เพิ่ม field
3. **เงินฝั่ง FE เป็น "estimate"** — ตัวจริงจาก `CheckoutResult.net_amount`; UI บอกชัดว่ายอดจริงยืนยันตอน checkout
4. **`expires_at` ไม่อยู่ใน payment API** → แคชใน `sessionStorage` (`lib/pending-payment.ts`) ตอนผ่าน /checkout
5. **ไม่มี rating/รูป avatar จริง** → ใช้ Unsplash placeholder (`lib/images.ts` — photo ID ตรวจ HTTP 200 แล้ว) และอักษรแรกในวงกลม; ห้ามใส่ตัวเลข/ข้อมูลปลอม
6. **ไม่มี emoji ในโค้ด/UI** — ใช้ lucide-react เท่านั้น
7. **R0 (migration/server/npm) = user รันเอง**; AI ห้ามรัน npm/makemigrations/server
8. Bottom nav ปัจจุบัน: Explore/Hotels/Cart/Orders/Profile — mock ใหม่เสนอ Home/Booking/Chat/Receipt/User ยัง **ค้างคำถาม** ว่าจะเปลี่ยนหรือไม่ (chat/booking ยังไม่มี feature)

---

## 5. Frontend File Map (สถานะ)

```
frontend/src/
├── app/
│   ├── (auth)/login|register|callback/google      # ✅ (อย่าแตะ)
│   ├── page.tsx                                    # ✅ Landing (อย่าแก้เว้นจำเป็น)
│   ├── layout.tsx + globals.css                    # ✅ root (อย่าแก้เว้นจำเป็น)
│   └── (mobile-tourist)/                           # tourist flow
│       ├── layout.tsx                              # ✅ shell (top bar + bottom nav)
│       ├── home/page.tsx                           # ✅ Explore (mock UI)
│       ├── hotels/page.tsx + [id]/page.tsx         # ✅ grid + detail/availability/add
│       ├── foods/page.tsx                          # ✅ grid 2-col + add
│       ├── wellness/page.tsx + [id]/page.tsx       # ✅ grid + detail(วัน/สล็อต)/add
│       ├── otop/page.tsx                           # ✅ 2-col grid + add
│       ├── cart/page.tsx                           # ✅ กลุ่มหมวด + qty + checkout
│       ├── checkout/page.tsx                       # ✅ สรุป + confirm
│       ├── checkout/payment/[paymentId]/page.tsx   # ✅ countdown + payee + slip upload
│       ├── my-bookings/page.tsx + [id]/page.tsx    # ✅ tabs + voucher
│       └── profile/page.tsx                        # ✅ (กัน 404)
├── components/
│   ├── navigation/MobileBottomNav.tsx              # ✅
│   ├── catalog/ DataStates.tsx, AddToCartButton.tsx# ✅
│   └── ui/ (button/card/input/label/…)             # ✅ (อย่าแตะ)
├── lib/
│   ├── api-client.ts, auth-api.ts, token-manager.ts, i18n.tsx, utils.ts  # ✅ auth (อย่าแตะ)
│   ├── api/ catalog.ts, booking.ts, errors.ts      # ✅ typed wrappers
│   ├── format.ts (money/date/time), images.ts (unsplash),
│   │   booking-presentation.ts, pending-payment.ts # ✅ helpers
├── store/ auth-store.ts, cart-store.ts             # ✅
├── i18n/messages.ts                                # ✅ TH/EN dictionary (เพิ่ม key ต้องทั้ง 2 ภาษา)
└── types/ api.ts, auth.ts, catalog.ts, booking.ts  # ✅ (auth.ts อย่าแตะ)
```

---

## 6. Known Issues / Edge Cases (สำคัญที่สุด)

1. **Money = Decimal string** ใน API (`"1500.00"`) → FE ใช้ `formatBaht`/`formatPriceText` ตอนแสดงเท่านั้น
2. **wellness slot.id = int** ต้องส่งเป็น int ตอน checkout; room/food/otop = UUID string (ห้ามสลับ/stringify ผิด)
3. **Public API ไม่มี vendor field** → cart กลุ่มตามหมวด; vendor portal (Module 7) ต้องคุยเรื่อง "เห็นของตัวเอง" (backend ยังไม่มี GET เฉพาะเจ้าของ + PATCH)
4. **payee_* = `""`** → แสดง placeholder จนกว่า user ให้เลขบัญชี + เติม config backend
5. **Slip upload = PENDING_CHECK เสมอ** (ยังไม่มี provider) → UI ต้องไม่บอกว่า "ชำระสำเร็จ"
6. **payment API ไม่มี `expires_at`** → countdown ใช้ค่าจาก sessionStorage ที่ /checkout เซฟไว้; deep-link ตรงจะไม่มี countdown
7. **Booking TTL/cancel จริง = Celery worker ฝั่ง backend** (ตอน dev ใช้ `CELERY_TASK_ALWAYS_EAGER` ยังไม่ expire อัตโนมัติตามเวลา)
8. **Room add ต้องมีวันที่** (backend reject); availability dict เป็นของเหลือจริง `minAvailable === 0` = เต็ม
9. Cart store `removeItem/updateQuantity` match (entity_id, item_type) — จองห้องเดียวกัน 2 ช่วงวันจะโดนทั้งคู่ (บันทึกไว้แล้ว)
10. Home search ถูก mock ทับ → ไม่มี search bar บน /home แล้ว (search อยู่ /otop)
11. ยังไม่มี test จริง (pytest/vitest/E2E) — smoke อยู่ใน /tmp เท่านั้น

---

## 7. Blocker / รอจาก user (R0 / config)

- [ ] รัน `npm run typecheck` + review Module 4–6 (user)
- [ ] เลขบัญชี/ชื่อ/ธนาคารผู้รับเงิน → เติม `payee_*` + config (backend C2 TODO)
- [ ] Vendor + credentials ของ Slip Check API → implement `_call_slip_provider()` + wire `verify_slip`
- [ ] Google OAuth console (origin + redirect) + `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] Redis + worker จริง (production) — ตอนนี้ `CELERY_TASK_ALWAYS_EAGER=True`
- [ ] ตัดสินใจ: bottom nav ตาม mock ใหม่ หรือคงชุดเดิม

---

## 8. งานที่เหลือ (หลัง Module 7 โค้ดเสร็จ)

1. **User QC (R0/R1):** รัน `npm run typecheck` + review Modules 4–7 ทุกบรรทัด + เทสต์ flow จริง (vendor ต้อง login ด้วย role ต่าง ๆ เพื่อเทสต์ role gate / 403)
2. **ปิดงาน deliverable:** user ยืนยันจบ Phase 1 → update สถานะในไฟล์นี้ (ตอนนี้ Module 7 = โค้ดเสร็จ รอ review)
3. Phase 2 (จดไว้): vendor-scoped GET/PATCH, incoming orders, payee config, Slip provider, Google OAuth config, Redis worker, test suite จริง

> งานเขียนโค้ด Phase 1 ครบทุก Module แล้ว — เหลือแต่ review/test/ปิดงานโดย user

---

## 9. Commands (R0 — user รันเองเท่านั้น)

```bash
# Frontend
cd /Users/tanchonl/Documents/welltrip/frontend
npm run dev          # http://127.0.0.1:3000
npm run typecheck
npm run build

# Backend (อยู่ใน backend/)
cd ../backend
.venv/bin/python manage.py check
.venv/bin/python manage.py runserver 0.0.0.0:8000
# smoke/เทสต์ที่เคยใช้ (user มีแล้ว): /tmp/welltrip_smoke.py, test_otop/payments/bookings, expiry_test

# Celery (Phase 2 / production)
redis-server
.venv/bin/python -m celery -A core worker -l info
```

---

## 10. กฎทำงานกับ AI ตัวถัดไป (จาก user)

1. **NO MAGIC** — อ่าน docs ทั้งหมด + โค้ดจริงก่อน อย่าเดา; ไม่รู้ถามก่อน
2. **SCOPE DRIFT** — ทำตามขอบเขต; ไอเดียใหม่จดไว้ ไม่แก้ของเดิมทันที
3. **DISSENT** — จะเปลี่ยนโครงสร้างที่ตกลงไว้ ถามก่อน + อธิบายเหตุผล
4. **R0 = user รันเอง; R1 = เขียนได้แต่ user review ทุกบรรทัด; R2 = ฟังก์ชันเล็ก**
5. **VERIFY BEFORE DONE** — จบเมื่อ user บอกจบ
6. อธิบายโค้ดทุกครั้งเป็นไทย + บอก WHY + QUIZ 1–3 ข้อ
7. เสนอทางเลือก ≥2 พร้อมข้อดี/ข้อเสีย
8. ONE MODULE = ONE MD (docs/C*.md)
9. Error/UI: lucide icons เท่านั้น, i18n TH+EN พร้อมกัน, i18n ผ่าน `useI18n().t()`
10. Debug: ห้ามวิเคราะห์ error ให้ user ตรง ๆ — แนะนำวิธีดูจุดที่ควรเช็คเท่านั้น (กฎ 5.4)

> **Phase 1 ปิดงานแล้ว** — AI ตัวถัดไปเริ่มงาน Phase 2 ต่อจาก §11 (อ่าน docs/C1–C12 + ไฟล์นี้ให้ครบก่อน)

---

## 11. ปิดงาน Phase 1 + ฝากถึง AI ตัวต่อไป (อัปเดต 2026-09-09)

### จุดแก้ท้ายสุดก่อนปิด (อย่าลืมดูโค้ดจริง)
1. `frontend/src/i18n/messages.ts` — ซ่อม `google: {` + `continue:` ที่หายไปตอนแทรกกลุ่ม keys (EN+TH) → syntax error
2. clear `.next` cache หลังลบหน้าเก่า (`rm -rf .next && npm run typecheck`)
3. `frontend/src/components/auth/google-button.tsx` — **hydration fix (user อนุมัติทางเลือก A)**: เดิมใช้ `useState(() => { if (typeof window === "undefined") return false; ...})` ทำให้ server render `<Button>` แต่ client render `<p>` ตอน env ว่าง → mismatch; แก้เป็นอ่าน `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID` ตรง ๆ (Next ในlined ให้ทั้ง 2 ฝั่ง deterministic)

### ฝากบอก AI ตัวต่อไป
- **อ่านก่อน:** `docs/C1.md`–`C12.md` + `phase1-remaining-summary.md` (ไฟล์นี้) ให้ครบทุกบรรทัด แล้วค่อยแตะโค้ด
- **สถานะ:** Phase 1 จบ (backend + FE tourist + FE vendor portal) — งานต่อคือ **Phase 2** ตามรายการนี้ (เรียงตาม impact):
  1. Vendor API ฝั่ง backend: **scoped GET (ดูของตัวเองรวมของที่ปิดขาย)** + **PATCH** (`is_available`, ราคา, ปิดสล็อต) → เมื่อมีแล้วค่อยกลับมาแก้ FE: cart กลุ่มตาม vendor (`groupedByVendor`), portal list/toggle จริง
  2. **Incoming orders** ของ vendor (ต้องออกแบบ endpoint กับ user ก่อน — ห้ามเดา)
  3. Config จริง: payee account (เติม `payee_*`), Slip Check provider (`_call_slip_provider` + wire `verify_slip`), Google OAuth console + `.env.local`, Redis/Celery worker จริง
  4. Test suite จริง (backend pytest, FE vitest, E2E) — ตอนนี้ smoke อยู่ใน `/tmp`
  5. Cleanup: dedupe `extractApiErrorMessage` (auth-api) ↔ `extractErrorMessage` (lib/api/errors), เลิกใช้ i18n keys ที่ตายแล้ว (`home.search*` หลัง redesign, `catalog.filter/price/results`, `errorOccurred` ถ้าไม่ใช้)
- **กฎเดิมยังมีผล:** auth files เดิมไม่แตะ (ยกเว้น google-button ที่แก้รับรองแล้ว) / R0 user รันเอง / R1 review ทุกบรรทัด / ONE MODULE = ONE MD (ต่อเป็น C13…) / i18n เพิ่ม TH+EN พร้อมกัน / lucide เท่านั้น ห้าม emoji ในโค้ด
- **กับดักที่เจอมาแล้ว (ระวังซ้ำ):**
  - แทรกกลุ่มใหญ่ใน `messages.ts` โดยใช้ anchor `google: {` ซ้ำ → อย่าลืมใส่ header กลุ่มเดิมคืน
  - `.next/` cache ค้างเวลาเพิ่ม/ลบ route → ลบ `.next` ก่อน typecheck
  - อย่าใช้ `typeof window`/`Date.now()`/`Math.random()` ใน render path ที่ SSR แล้วไม่ match
  - `NEXT_PUBLIC_*` เปลี่ยนแล้วต้อง restart dev (ในlined ตอน compile)



