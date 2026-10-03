ได้เลยครับ ผมจะสร้าง **Prompt ฉบับสมบูรณ์** สำหรับส่ง AI ให้เริ่มทำงาน Phase 1 ที่เหลือต่อจาก Authentication ครับ

---

```text
# WellTrip Platform — Phase 1 Remaining Modules Implementation

## Context & Project State

- **Current State:** Authentication submodule (Custom User model with 7 roles, JWT rotation, Google OAuth, Auth frontend screens) is **fully completed and tested**.
- **Reference Spec:** The full Master System Architecture (Database Schema, Folder Structure, API Endpoints, Business Logic) was provided in the initial prompt of this chat session. Please refer to that document for all structural details.
- **Tech Stack:** Django 5.x + DRF + PostgreSQL (Backend) | Next.js 14+ App Router, Tailwind CSS, Lucide Icons, React Hook Form + Zod, TanStack Query, Zustand (Frontend).
- **Goal:** Implement the remaining Phase 1 backend apps, database models, business logic transactions, REST APIs, and Mobile-First frontend screens.
- **Constraints:** Mobile-First responsive design (`max-w-md` shell centered on desktop), strict zero-emoji enforcement (use official Lucide React icons only), standardized API envelope format (`{ success, data, message }`), and PostgreSQL atomic concurrency locks (`select_for_update()`).

---

## Implementation Order (Critical)

To avoid dependency conflicts, please implement in this exact order:

1. **Backend Models** — All apps (`accommodations`, `services`, `otop`, `bookings`, `payments`) — complete models + migrations first
2. **Backend Business Logic** — `services.py` for each app (availability calculation, price calculation, atomic checkout)
3. **Backend Views + Serializers** — CRUD APIs for each app
4. **Celery Tasks** — Expiration worker + rollback logic (15-min TTL)
5. **Frontend Zustand Stores** — Cart store, Booking store
6. **Frontend Pages** — Tourist routes first (`/home`, `/hotels`, `/cart`, `/checkout`, `/my-bookings`) then Vendor Portal

---

## What NOT to Do (Guardrails)

- DO NOT modify anything in `apps.authentication` — it's complete and tested.
- DO NOT change the User model or any existing Auth endpoints.
- DO NOT add LINE-related code anywhere (already removed).
- DO NOT use emojis — use Lucide icons only.
- DO NOT hardcode secrets — use `.env` for all sensitive values.
- DO NOT skip `select_for_update()` in any inventory-locking logic.
- DO NOT create hard-delete endpoints — use `is_active=False` pattern.

---

## 1. Backend Implementation Specifications

### 1.1 App: `apps.accommodations`

#### Database Models

- `Accommodation`: `id` (UUID, PK), `owner` (FK to User, `on_delete=models.RESTRICT`), `name`, `slug` (unique), `description`, `address`, `subdistrict`, `district`, `province` (indexed), `postal_code`, `latitude`, `longitude`, `checkin_time` (default 14:00), `checkout_time` (default 12:00), `status` (Choices: `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`), `created_at`
- `Room`: `id` (UUID, PK), `accommodation` (FK, `on_delete=models.CASCADE`), `name`, `description`, `base_capacity` (int, default 2), `max_capacity` (int, default 2), `base_price_per_night` (Decimal), `total_inventory` (int), `amenities` (JSONB), `is_active` (bool)
- `RoomImage`: `id` (BigSerial), `room` (FK, `on_delete=models.CASCADE`), `image_url` (URLField), `order` (int, default 0), `is_primary` (bool, default False)
- `RoomPricingCalendar`: `id` (BigSerial), `room` (FK, `on_delete=models.CASCADE`), `date` (DateField, indexed), `price_override` (Decimal, nullable), `available_count` (int). Unique constraint on `(room, date)`

#### Business Logic & Service Methods

```python
def calculate_room_availability(room_id, checkin_date, checkout_date):
    """Check total inventory minus confirmed or AWAITING_PAYMENT bookings for each date."""
    # Use select_for_update() when called from checkout transaction
    # Return dict of date -> available_count
```

```python
def get_total_room_price(room_id, checkin_date, checkout_date):
    """Compute sum of nightly rates taking custom date pricing into account."""
    # Prefer price_override from RoomPricingCalendar, fallback to base_price_per_night
```

#### Serializers & Views

- Public List/Retrieve with filters: `province`, `min_price`, `max_price`, `checkin`, `checkout`, `guests`
- Partner CRUD ViewSet for `Accommodation` and `Room` (scoped to `request.user == owner`, only `HOMESTAY_OWNER` role)
- Endpoints:
  - `GET /api/v1/accommodations/`
  - `POST /api/v1/accommodations/` (HOMESTAY_OWNER)
  - `GET /api/v1/accommodations/{id}/rooms/`
  - `POST /api/v1/accommodations/{id}/rooms/` (HOMESTAY_OWNER)
  - `POST /api/v1/accommodations/rooms/{id}/pricing/` (HOMESTAY_OWNER)

---

### 1.2 App: `apps.services` (Healthy Food & Wellness)

#### Database Models

- `FoodMenu`: `id` (UUID, PK), `owner` (FK to User, `on_delete=models.RESTRICT`), `name` (indexed), `description`, `price` (Decimal), `wellness_category` (Choices: `LOW_SUGAR`, `LOW_SODIUM`, `ORGANIC`, `HERBAL`, `VEGAN`), `calorie_estimate` (int, nullable), `is_available` (bool), `image_url`
- `WellnessService`: `id` (UUID, PK), `owner` (FK to User, `on_delete=models.RESTRICT`), `title`, `description`, `price` (Decimal), `duration_minutes` (int), `max_capacity_per_session` (int, default 1), `is_active` (bool)
- `WellnessTimeSlot`: `id` (BigSerial), `service` (FK, `on_delete=models.CASCADE`), `slot_date` (DateField, indexed), `start_time` (TimeField), `end_time` (TimeField), `capacity_available` (int). Unique constraint on `(service, slot_date, start_time)`

#### Serializers & Views

- Public feeds with filtering: `wellness_category=LOW_SUGAR,VEGAN`, `max_calorie`
- Date-based available slot queries: `GET /api/v1/wellness/{id}/slots/?date=YYYY-MM-DD`
- Vendor ViewSets for CRUD and slot generation (scoped to owner, role `RESTAURANT_OWNER` / `WELLNESS_OWNER`)

---

### 1.3 App: `apps.otop` (Community Products)

#### Database Models

- `OTOPProduct`: `id` (UUID, PK), `owner` (FK to User, `on_delete=models.RESTRICT`), `name` (indexed), `description`, `category` (Choices: `HERBAL_PRODUCT`, `TEXTILE`, `PROCESSED_FOOD`, `CRAFT`), `price` (Decimal), `stock_quantity` (int, >= 0), `sku` (unique, indexed), `is_active` (bool)

#### Serializers & Views

- Public product catalog with search, category filtering, and in-stock checks
- Owner management CRUD with inventory adjustments (role `OTOP_OWNER`)

---

### 1.4 App: `apps.bookings` & `apps.payments` (Atomic Booking Engine & PromptPay)

#### Database Models

- `Booking`: `id` (UUID, PK), `booking_code` (unique, format: `WT-YYYYMMDD-XXXXXX`), `user` (FK to User, `on_delete=models.RESTRICT`), `status` (Choices: `AWAITING_PAYMENT`, `PAYMENT_EXPIRED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`), `total_subtotal` (Decimal), `platform_fee` (Decimal, default 0), `net_amount` (Decimal), `expires_at` (DateTimeField, created + 15 min), `created_at`, `updated_at`
- `BookingItem`: `id` (BigSerial), `booking` (FK, `on_delete=models.CASCADE`), `item_type` (Choices: `ROOM_RESERVATION`, `FOOD_ORDER`, `WELLNESS_SESSION`, `OTOP_GOODS`), `entity_id` (UUID), `vendor_id` (FK to User), `item_title_snapshot` (string), `unit_price_snapshot` (Decimal), `quantity` (int), `total_price` (Decimal), `scheduled_date` (nullable), `scheduled_end_date` (nullable), `scheduled_time_slot` (nullable)
- `Payment`: `id` (UUID, PK), `booking` (1-to-1, FK, `on_delete=models.RESTRICT`), `payment_channel` (Choices: `PROMPTPAY_QR`, `CREDIT_CARD`), `gateway_charge_id` (nullable, indexed), `qr_raw_string` (text, nullable), `qr_image_url` (text, nullable), `amount` (Decimal), `status` (Choices: `PENDING`, `SUCCESS`, `FAILED`, `EXPIRED`), `paid_at` (nullable), `gateway_response_log` (JSONB, nullable)

#### Atomic Checkout Business Logic

```python
@transaction.atomic
def execute_atomic_checkout(cart_items, user):
    # 1. For each item, use select_for_update()
    # 2. Verify inventory/availability
    # 3. Deduct temporary availability (room_calendar, wellness_slot, otop_stock)
    # 4. Create Booking with status AWAITING_PAYMENT
    # 5. Create BookingItem snapshots
    # 6. Generate EMVCo PromptPay QR string
    # 7. Create Payment record
    # 8. Enqueue Celery task: expire_booking_task.apply_async(countdown=900)
    # 9. Return booking_code and payment QR
```

#### Rollback & Expiration Worker

```python
@shared_task
def expire_booking_task(booking_id):
    """Run after 15-min TTL. If still AWAITING_PAYMENT, rollback all inventory."""
    # 1. select_for_update() on booking
    # 2. If status == AWAITING_PAYMENT:
    #    - Set to PAYMENT_EXPIRED
    #    - Restore room_calendar.available_count for each date
    #    - Restore wellness_slot.capacity_available
    #    - Restore otop_product.stock_quantity
    #    - Send FCM notification (placeholder for Phase 3)
```

#### Webhook Verification

- `POST /api/v1/payments/webhooks/omise/`
- Verify HMAC-SHA256 signature using `OMISE_WEBHOOK_SECRET_KEY`
- On `charge.complete`: update Payment → SUCCESS, Booking → CONFIRMED
- Reject unverified requests with HTTP 401

---

## 2. Frontend Implementation Specifications

### 2.1 Tourist Client Routes (Mobile-First Scaffold)

#### `/home` (Explore / Discovery View)
- Hero search bar with filters (province, category)
- Horizontal scrolling category cards (Hotels, Healthy Foods, Wellness, OTOP)
- Quick action shortcuts

#### `/hotels` and `/hotels/[id]`
- Hotel listing with search + province filters + price range
- Detail view: image carousel, room cards, amenities badges (Lucide icons), date range picker
- "Book Now" button → adds to cart

#### `/foods`, `/wellness`, `/otop`
- Similar list/detail patterns with category filters and add-to-cart

#### `/cart` & `/checkout`
- Multi-vendor unified cart powered by Zustand (persist to localStorage)
- Summary breakdown: itemized costs by vendor
- Checkout execution: `POST /api/v1/bookings/checkout/`
- On success → redirect to `/checkout/payment-qr/{booking_id}`

#### `/checkout/payment-qr/[id]`
- PromptPay QR image display
- Real-time 15-minute countdown timer
- Order reference code (`WT-...`)
- Auto-redirect to `/my-bookings/[id]` when payment confirmed (polling every 3-5 sec)

#### `/my-bookings` & `/my-bookings/[id]`
- Tabbed booking history: `ACTIVE`, `COMPLETED`, `CANCELLED`
- Booking voucher detail: status badge, item list, check-in/out dates, total amount

### 2.2 Vendor / Partner Dashboard (`/portal`)

#### Layout
- Responsive sidebar (collapsible on mobile)
- Role-based menu: only show sections user has permission for

#### `/portal/homestay`
- Dashboard: incoming booking requests with Approve/Reject buttons
- Room inventory calendar + price-override manager
- Toggle availability for each room

#### `/portal/restaurant`
- Menu list with "Available/Sold-out" toggle
- Order management: view incoming orders (read-only for Phase 1)

#### `/portal/wellness`
- Service list + time slot generator
- Capacity monitor per slot

#### `/portal/otop`
- Product inventory management (CRUD + stock adjustment)
- SKU tracking

---

## 3. UI/UX & Quality Enforcement

### Icon Guidelines

| Feature | Lucide Icon |
|---------|-------------|
| Accommodations | `<Hotel/>`, `<BedDouble/>`, `<CalendarDays/>`, `<Users/>` |
| Healthy Dining | `<UtensilsCrossed/>`, `<Salad/>`, `<Flame/>`, `<Apple/>` |
| Wellness | `<Sparkles/>`, `<Clock/>`, `<HeartPulse/>`, `<Bath/>` |
| OTOP | `<ShoppingBag/>`, `<Package/>`, `<Tag/>`, `<Store/>` |
| Navigation | `<Compass/>`, `<Search/>`, `<Receipt/>`, `<User/>` |
| Status | `<CheckCircle2/>`, `<AlertCircle/>`, `<Clock3/>`, `<XCircle/>` |
| Payment | `<QrCode/>`, `<CreditCard/>`, `<ShieldCheck/>` |

**Strict Rule: No emojis anywhere. Use Lucide icons only.**

### API Response Contract

**Success:**
```json
{ "success": true, "data": {}, "message": "Success message" }
```

**Error:**
```json
{ "success": false, "error": { "code": "ERROR_CODE", "details": {} }, "message": "Error message" }
```

---

## 4. Deliverable Requirements

1. **Backend:** Production-ready typed code for all models, serializers, views, services, tasks
2. **Frontend:** Full pages with Zustand stores, Zod schema validation, TanStack Query integration
3. **Database:** Django migrations for all new models (generate with `makemigrations`)
4. **Documentation:** Create a `C1.md` after completion with:
   - All API endpoints added
   - Database schema changes
   - Known issues / edge cases
   - TODO for Phase 2

---

## 5. Starting Point

Please begin with **Step 1: Backend Models** for all apps in this order:
1. `apps.accommodations/models.py`
2. `apps.services/models.py`
3. `apps.otop/models.py`
4. `apps.bookings/models.py`
5. `apps.payments/models.py`

Create migrations after each app is complete. Do not proceed to Step 2 until all models are done and migrated.

If anything is unclear, ask before proceeding.
```

