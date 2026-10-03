ขออภัยครับ พลาดเองเต็มๆ ไปกวาดเอา LINE กลับเข้ามาอีก ตัด LINE ทิ้งหมดทุกจุด 100% ไม่เหลือทั้งในโค้ด Database และ Flow อีกต่อไป ระบบใช้แค่ **Email/Password** และ **Google OAuth** มาตรฐานเท่านั้นครับ

---

## MASTER SYSTEM ARCHITECTURE & IMPLEMENTATION SPECIFICATION (CLEAN VERSION)

### Project: WellTrip - Smart Wellness Tourism Platform for Community (Phase 1)

---

### 1. Technology Stack Specification

#### Frontend Framework & Client Runtime

* **Core Framework:** Next.js 14+ (App Router Architecture, React 18/19, TypeScript Strict Mode).
* **Styling & Layout:** Tailwind CSS v3.4+, PostCSS, Autoprefixer.
* **Design Pattern:** Mobile-First Responsive Design (Default Viewport: 390x844px Mobile View, Scalable to Tablet 768px and Desktop 1280px+).
* **Component Primitives:** Shadcn/ui (Radix UI Primitives), Lucide React (Official UI Icon System only; strict zero-emoji enforcement across all Views).
* **Client State & Server Cache:** TanStack Query v5 (React Query) for Server State Caching/Hydration, Zustand for Global Client States (Cart, Active Filter, User Location).
* **Form & Validation Pipeline:** React Hook Form, Zod Schema Validation.
* **Networking Client:** Axios Instance with Request/Response Interceptors for Bearer JWT Handling and Silent Refresh.
* **Push Notification Client:** Firebase Cloud Messaging (FCM) Web SDK (`firebase/messaging`) registered via Web Service Worker (`firebase-messaging-sw.js`).

#### Backend Framework & Server Runtime

* **Runtime & Framework:** Python 3.11+, Django 5.x, Django REST Framework (DRF).
* **Authentication Engine:** `djangorestframework-simplejwt` (Stateless Access Token + Rotating Refresh Token), Google OAuth 2.0 Verification Handlers (`google-auth`).
* **Database & ORM:** PostgreSQL 15+ with Native JSONB, UUID extension, and B-Tree indexing.
* **Asynchronous Task Engine:** Celery v5+, Redis 7+ (Broker & Result Backend) for Background Tasks, Expiration Workers, and Push Notifications.
* **Push Notification Service (Server):** `firebase-admin` Python SDK for Topic Messaging and Direct Device Token Dispatch.
* **Static & Media Asset Handling:** WhiteNoise (Production Static), AWS S3 / Cloudflare R2 via `django-storages` with Presigned Upload URLs.
* **Payment Integration:** PromptPay QR (Bot/EMVCo standard string generation), Omise Payment Webhook Gateway.

---

### 2. Comprehensive Database Schema & Entity Relationships

#### 2.1 Identity, Access Management & Health Profiles (`apps.users`)

* **`users` Table:**
* `id`: UUID (Primary Key, default `uuid7` or `uuid4`).
* `username`: VARCHAR(150), Unique, Indexed.
* `email`: VARCHAR(254), Unique, Indexed.
* `password`: VARCHAR(128), Hashed via Argon2 / PBKDF2 (Nullable for pure Google OAuth users).
* `first_name`: VARCHAR(150).
* `last_name`: VARCHAR(150).
* `phone_number`: VARCHAR(20), Indexed.
* `role`: VARCHAR(30) (ENUM: `TOURIST`, `HOMESTAY_OWNER`, `RESTAURANT_OWNER`, `WELLNESS_OWNER`, `OTOP_OWNER`, `COMMUNITY_ADMIN`, `SUPER_ADMIN`).
* `google_sub_id`: VARCHAR(255), Nullable, Unique, Indexed.
* `is_active`: BOOLEAN, Default `True`.
* `is_verified`: BOOLEAN, Default `False`.
* `created_at`: TIMESTAMP WITH TIME ZONE, Default `NOW()`.
* `updated_at`: TIMESTAMP WITH TIME ZONE, Auto-update.


* **`fcm_device_tokens` Table:**
* `id`: BIGSERIAL (Primary Key).
* `user_id`: UUID (Foreign Key to `users.id`, on_delete `CASCADE`).
* `registration_token`: TEXT, Unique, Indexed.
* `device_type`: VARCHAR(20) (`WEB_MOBILE`, `WEB_DESKTOP`, `ANDROID`, `IOS`).
* `is_active`: BOOLEAN, Default `True`.
* `last_seen_at`: TIMESTAMP WITH TIME ZONE, Default `NOW()`.


* **`health_profiles` Table:**
* `id`: BIGSERIAL (Primary Key).
* `user_id`: UUID (Foreign Key to `users.id`, Unique 1-to-1, on_delete `CASCADE`).
* `weight_kg`: NUMERIC(5, 2), Validated (> 0).
* `height_cm`: NUMERIC(5, 2), Validated (> 0).
* `calculated_bmi`: NUMERIC(4, 2), Auto-computed.
* `health_goal`: VARCHAR(100), Indexed.
* `dietary_preferences`: JSONB (Array of strings, e.g., `["VEGAN", "LOW_SODIUM", "HALAL"]`).
* `allergies`: JSONB (Array of strings).
* `chronic_conditions`: JSONB (Array of strings).
* `updated_at`: TIMESTAMP WITH TIME ZONE, Auto-update.



#### 2.2 Accommodations & Inventory Management (`apps.accommodations`)

* **`accommodations` Table:**
* `id`: UUID (Primary Key).
* `owner_id`: UUID (Foreign Key to `users.id`, on_delete `RESTRICT`).
* `name`: VARCHAR(255), Indexed.
* `slug`: VARCHAR(255), Unique, Indexed.
* `description`: TEXT.
* `address`: TEXT.
* `subdistrict`: VARCHAR(100).
* `district`: VARCHAR(100).
* `province`: VARCHAR(100), Indexed.
* `postal_code`: VARCHAR(10).
* `latitude`: NUMERIC(9, 6).
* `longitude`: NUMERIC(9, 6).
* `checkin_time`: TIME, Default `14:00:00`.
* `checkout_time`: TIME, Default `12:00:00`.
* `status`: VARCHAR(20) (ENUM: `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`).
* `created_at`: TIMESTAMP WITH TIME ZONE, Default `NOW()`.


* **`rooms` Table:**
* `id`: UUID (Primary Key).
* `accommodation_id`: UUID (Foreign Key to `accommodations.id`, on_delete `CASCADE`).
* `name`: VARCHAR(200).
* `description`: TEXT.
* `base_capacity`: INTEGER, Default 2.
* `max_capacity`: INTEGER, Default 2.
* `base_price_per_night`: NUMERIC(10, 2), Validated (> 0).
* `total_inventory`: INTEGER, Validated (>= 1).
* `amenities`: JSONB (e.g., `{"wifi": true, "aircon": true, "breakfast": false}`).
* `is_active`: BOOLEAN, Default `True`.


* **`room_images` Table:**
* `id`: BIGSERIAL (Primary Key).
* `room_id`: UUID (Foreign Key to `rooms.id`, on_delete `CASCADE`).
* `image_url`: VARCHAR(1000).
* `order`: INTEGER, Default 0.
* `is_primary`: BOOLEAN, Default `False`.


* **`room_pricing_calendars` Table:**
* `id`: BIGSERIAL (Primary Key).
* `room_id`: UUID (Foreign Key to `rooms.id`, on_delete `CASCADE`).
* `date`: DATE, Indexed.
* `price_override`: NUMERIC(10, 2), Nullable.
* `available_count`: INTEGER.
* Unique Constraint: `(room_id, date)`.



#### 2.3 Community Wellness, Dining & Retail Services (`apps.services` & `apps.otop`)

* **`food_menus` Table:**
* `id`: UUID (Primary Key).
* `owner_id`: UUID (Foreign Key to `users.id`, on_delete `RESTRICT`).
* `name`: VARCHAR(200), Indexed.
* `description`: TEXT.
* `price`: NUMERIC(10, 2), Validated (> 0).
* `wellness_category`: VARCHAR(50) (ENUM: `LOW_SUGAR`, `LOW_SODIUM`, `ORGANIC`, `HERBAL`, `VEGAN`).
* `calorie_estimate`: INTEGER, Nullable.
* `is_available`: BOOLEAN, Default `True`.
* `image_url`: VARCHAR(1000).


* **`wellness_services` Table:**
* `id`: UUID (Primary Key).
* `owner_id`: UUID (Foreign Key to `users.id`, on_delete `RESTRICT`).
* `title`: VARCHAR(200).
* `description`: TEXT.
* `price`: NUMERIC(10, 2).
* `duration_minutes`: INTEGER, Validated (> 0).
* `max_capacity_per_session`: INTEGER, Default 1.
* `is_active`: BOOLEAN, Default `True`.


* **`wellness_time_slots` Table:**
* `id`: BIGSERIAL (Primary Key).
* `service_id`: UUID (Foreign Key to `wellness_services.id`, on_delete `CASCADE`).
* `slot_date`: DATE, Indexed.
* `start_time`: TIME.
* `end_time`: TIME.
* `capacity_available`: INTEGER.
* Unique Constraint: `(service_id, slot_date, start_time)`.


* **`otop_products` Table:**
* `id`: UUID (Primary Key).
* `owner_id`: UUID (Foreign Key to `users.id`, on_delete `RESTRICT`).
* `name`: VARCHAR(200), Indexed.
* `category`: VARCHAR(50) (ENUM: `HERBAL_PRODUCT`, `TEXTILE`, `PROCESSED_FOOD`, `CRAFT`).
* `description`: TEXT.
* `price`: NUMERIC(10, 2).
* `stock_quantity`: INTEGER, Validated (>= 0).
* `sku`: VARCHAR(100), Unique, Indexed.
* `is_active`: BOOLEAN, Default `True`.



#### 2.4 Cart, Consolidated Orders & Payments Engine (`apps.bookings`)

* **`bookings` Table:**
* `id`: UUID (Primary Key).
* `booking_code`: VARCHAR(32), Unique, Indexed (Format: `WT-YYYYMMDD-XXXXXX`).
* `user_id`: UUID (Foreign Key to `users.id`, on_delete `RESTRICT`).
* `status`: VARCHAR(30) (ENUM: `AWAITING_PAYMENT`, `PAYMENT_EXPIRED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
* `total_subtotal`: NUMERIC(10, 2).
* `platform_fee`: NUMERIC(10, 2), Default 0.00.
* `net_amount`: NUMERIC(10, 2).
* `expires_at`: TIMESTAMP WITH TIME ZONE (Created + 15 Minutes Strict TTL).
* `created_at`: TIMESTAMP WITH TIME ZONE, Default `NOW()`.
* `updated_at`: TIMESTAMP WITH TIME ZONE, Auto-update.


* **`booking_items` Table:**
* `id`: BIGSERIAL (Primary Key).
* `booking_id`: UUID (Foreign Key to `bookings.id`, on_delete `CASCADE`).
* `item_type`: VARCHAR(30) (ENUM: `ROOM_RESERVATION`, `FOOD_ORDER`, `WELLNESS_SESSION`, `OTOP_GOODS`).
* `entity_id`: UUID (Generic reference to target model).
* `vendor_id`: UUID (Foreign Key to `users.id`, on_delete `RESTRICT`).
* `item_title_snapshot`: VARCHAR(255).
* `unit_price_snapshot`: NUMERIC(10, 2).
* `quantity`: INTEGER, Validated (>= 1).
* `total_price`: NUMERIC(10, 2).
* `scheduled_date`: DATE, Nullable (For Rooms & Wellness).
* `scheduled_end_date`: DATE, Nullable (For Hotel Check-out).
* `scheduled_time_slot`: VARCHAR(50), Nullable.


* **`payments` Table:**
* `id`: UUID (Primary Key).
* `booking_id`: UUID (Foreign Key to `bookings.id`, Unique 1-to-1, on_delete `RESTRICT`).
* `payment_channel`: VARCHAR(30) (ENUM: `PROMPTPAY_QR`, `CREDIT_CARD`).
* `gateway_charge_id`: VARCHAR(255), Nullable, Indexed.
* `qr_raw_string`: TEXT, Nullable (EMVCo Payload).
* `qr_image_url`: TEXT, Nullable.
* `amount`: NUMERIC(10, 2).
* `status`: VARCHAR(30) (ENUM: `PENDING`, `SUCCESS`, `FAILED`, `EXPIRED`).
* `paid_at`: TIMESTAMP WITH TIME ZONE, Nullable.
* `gateway_response_log`: JSONB, Nullable.



---

### 3. Folder Structure Architecture

```text
welltrip-platform/
├── backend/
│   ├── manage.py
│   ├── Dockerfile
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── local.txt
│   │   └── production.txt
│   ├── core/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── celery.py
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── local.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── authentication/
│   │   │   ├── models.py          # User, FCMDeviceToken
│   │   │   ├── serializers.py
│   │   │   ├── views.py           # Email/Password JWT, Google OAuth
│   │   │   ├── services.py        # Token issuance, Google ID Token verification
│   │   │   └── urls.py
│   │   ├── health/
│   │   │   ├── models.py          # HealthProfile
│   │   │   ├── serializers.py
│   │   │   └── views.py
│   │   ├── accommodations/
│   │   │   ├── models.py          # Accommodation, Room, RoomPricingCalendar
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── services.py        # Calendar check, inventory calculation
│   │   │   └── urls.py
│   │   ├── services/
│   │   │   ├── models.py          # FoodMenu, WellnessService, WellnessTimeSlot
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── otop/
│   │   │   ├── models.py          # OTOPProduct
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   ├── bookings/
│   │   │   ├── models.py          # Booking, BookingItem
│   │   │   ├── serializers.py
│   │   │   ├── views.py           # Checkout, Cart Verification
│   │   │   ├── services.py        # Atomic reserve, Rollback, Inventory Lock
│   │   │   ├── tasks.py           # Celery 15-min TTL expiration workers
│   │   │   └── urls.py
│   │   ├── payments/
│   │   │   ├── models.py          # Payment
│   │   │   ├── serializers.py
│   │   │   ├── views.py           # Gateway Webhook, QR Request
│   │   │   ├── services.py        # EMVCo String generator, Webhook Signature Check
│   │   │   └── urls.py
│   │   └── notifications/
│   │       ├── services.py        # FCM push notification dispatcher
│   │       ├── tasks.py           # Celery background dispatch
│   │       └── urls.py
│   └── common/
│       ├── exceptions.py          # Standardized exception handler
│       ├── pagination.py          # Standard limit-offset & page pagination
│       ├── permissions.py         # Role-based DRF permissions
│       ├── responses.py           # Standard API response wrappers
│       └── validators.py          # PhoneNumber, Coordinates
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   ├── public/
│   │   ├── firebase-messaging-sw.js # FCM Background Worker
│   │   └── assets/icons/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx         # Global Providers (Query, Auth, FCM, Theme)
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   └── callback/
│       │   │       └── google/page.tsx
│       │   ├── (mobile-tourist)/  # Main Tourist App Viewport
│       │   │   ├── layout.tsx     # Mobile Scaffold + Bottom Navigation Bar
│       │   │   ├── page.tsx       # Discovery / Home View
│       │   │   ├── search/page.tsx
│       │   │   ├── hotels/
│       │   │   │   ├── page.tsx   # Filtered list
│       │   │   │   └── [id]/page.tsx
│       │   │   ├── foods/page.tsx
│       │   │   ├── wellness/page.tsx
│       │   │   ├── otop/page.tsx
│       │   │   ├── cart/page.tsx
│       │   │   ├── checkout/
│       │   │   │   ├── page.tsx
│       │   │   │   └── payment-qr/[id]/page.tsx
│       │   │   ├── my-bookings/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   └── profile/page.tsx
│       │   └── (portal)/          # Vendor & Community Management Portal
│       │       ├── layout.tsx     # Responsive Sidebar Scaffold
│       │       ├── homestay/
│       │       ├── restaurant/
│       │       ├── wellness/
│       │       ├── otop/
│       │       └── community/
│       ├── components/
│       │   ├── ui/                # Shadcn primitives
│       │   ├── navigation/        # MobileBottomNav, MobileTopHeader, DesktopNavbar
│       │   ├── notifications/     # FCMNotificationHandler, NotificationCenter
│       │   ├── booking/           # RoomCard, ServiceSlotPicker, StickyBookingBar
│       │   └── shared/            # StatusBadge, PriceDisplay, LucideIconWrapper
│       ├── hooks/
│       │   ├── use-fcm.ts         # FCM token registration & onMessage handler
│       │   ├── use-cart.ts        # Cart calculation & Zustand hook
│       │   ├── use-auth.ts
│       │   └── use-device.ts      # Breakpoint & Touch detection
│       ├── lib/
│       │   ├── api-client.ts      # Axios configured instance
│       │   ├── firebase.ts        # Firebase app initialization
│       │   ├── token-manager.ts   # Secure local/cookie token storage
│       │   └── utils.ts
│       ├── schemas/               # Zod validation schemas
│       └── types/                 # Shared TypeScript models & responses

```

---

### 4. API Endpoints & Contract Specifications

#### Standard Response Envelopes

* **Success Envelope (HTTP 200/201):**

```json
{
  "success": true,
  "data": {},
  "message": "Resource retrieved or created successfully",
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 100,
      "total_pages": 5
    }
  }
}

```

* **Error Envelope (HTTP 4xx/5xx):**

```json
{
  "success": false,
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "details": {
      "slot_id": ["The selected wellness slot has already reached maximum capacity."]
    }
  },
  "message": "Failed to complete reservation due to capacity constraints."
}

```

#### Core Endpoint Matrix

| HTTP Verb | Path | Auth / Role | Description & Payload Rules |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register/` | Public | Manual Tourist Registration (Email, Password, Name, Phone). |
| `POST` | `/api/v1/auth/login/` | Public | Returns `access_token`, `refresh_token`, and user profile. |
| `POST` | `/api/v1/auth/oauth/google/` | Public | Body: `{ "id_token": "STRING" }`. Validates Google OpenID. |
| `POST` | `/api/v1/notifications/fcm/register/` | Authenticated | Body: `{ "token": "STRING", "device_type": "WEB_MOBILE" }`. |
| `GET` | `/api/v1/accommodations/` | Public | Query: `province`, `checkin`, `checkout`, `guests`, `min_price`, `max_price`. |
| `POST` | `/api/v1/accommodations/` | `HOMESTAY_OWNER` | Multi-part form for Homestay creation. |
| `GET` | `/api/v1/accommodations/{id}/rooms/` | Public | Retrieves all active rooms with computed dates & availability. |
| `POST` | `/api/v1/accommodations/{id}/rooms/` | `HOMESTAY_OWNER` | Room creation with base inventory. |
| `POST` | `/api/v1/accommodations/rooms/{id}/pricing/` | `HOMESTAY_OWNER` | Set custom calendar pricing and inventory blocks. |
| `GET` | `/api/v1/foods/` | Public | Query: `category=LOW_SUGAR,VEGAN`, `max_calorie`. |
| `POST` | `/api/v1/foods/` | `RESTAURANT_OWNER` | Menu creation with nutrition/wellness tags. |
| `GET` | `/api/v1/wellness/` | Public | List spa and massage packages. |
| `GET` | `/api/v1/wellness/{id}/slots/` | Public | Query: `date=YYYY-MM-DD`. Returns slots with real-time `capacity_available`. |
| `POST` | `/api/v1/wellness/{id}/slots/` | `WELLNESS_OWNER` | Generate recurring or manual time slots. |
| `GET` | `/api/v1/otop/` | Public | Product list with search and category filters. |
| `POST` | `/api/v1/otop/` | `OTOP_OWNER` | Create product and assign initial stock quantity. |
| `POST` | `/api/v1/bookings/checkout/` | `TOURIST` | Atomic checkout execution across multi-vendor cart items. |
| `GET` | `/api/v1/bookings/my-orders/` | `TOURIST` | Paginated booking history with order status codes. |
| `GET` | `/api/v1/bookings/{id}/` | Authenticated | Single booking details with payment and items breakdown. |
| `POST` | `/api/v1/payments/promptpay/generate/` | `TOURIST` | Body: `{ "booking_id": "UUID" }`. Returns raw EMVCo & QR image URL. |
| `POST` | `/api/v1/payments/webhooks/omise/` | Public (Signed) | Webhook target verifying `charge.complete` events. |

---

### 5. Critical Business Logic & Concurrency Control

#### 5.1 Atomic Multi-Vendor Checkout & Inventory Lock

* When `POST /api/v1/bookings/checkout/` is triggered:
1. Initialize `transaction.atomic()` with PostgreSQL strict isolation.
2. For every item in the cart:
* **Rooms:** Query `rooms` using `select_for_update()`. Check `room_pricing_calendars` for each night in the range `[checkin, checkout)`. If `available_count < requested_rooms`, abort transaction with `409 Conflict`. Decrement `available_count`.
* **Wellness:** Query `wellness_time_slots` using `select_for_update()`. Verify `capacity_available >= requested_qty`. If insufficient, abort transaction. Decrement `capacity_available`.
* **OTOP Goods:** Query `otop_products` using `select_for_update()`. Verify `stock_quantity >= requested_qty`. If insufficient, abort transaction. Decrement `stock_quantity`.


3. Create `bookings` instance with status `AWAITING_PAYMENT`.
4. Generate snapshot rows in `booking_items` locking unit prices.
5. Schedule a Celery Task: `expire_booking_task.apply_async(args=[booking.id], countdown=900)` (15-Minute strict TTL).
6. Return `booking_code` and total summary.



#### 5.2 15-Minute Time-To-Live (TTL) & Automated Rollback Worker

* Celery periodic and countdown workers track expiring reservations.
* If `bookings.status` remains `AWAITING_PAYMENT` after `expires_at`:
1. Open `transaction.atomic()`.
2. Transition booking status to `PAYMENT_EXPIRED`.
3. Iterate across `booking_items`:
* Restore `room_pricing_calendars.available_count`.
* Restore `wellness_time_slots.capacity_available`.
* Restore `otop_products.stock_quantity`.


4. Dispatch FCM Notification to the user device: `Reservation Expired: Items in your booking have been released.`



#### 5.3 Referential Integrity & Deletion Guards

* **Hard Deletion Prohibited:** Entities tied to transactional records (`users`, `accommodations`, `rooms`, `food_menus`, `wellness_services`, `otop_products`) must never be physically purged from the database if related `booking_items` exist.
* Soft-deletion pattern: Toggle `is_active = False` or `status = 'SUSPENDED'`.
* Foreign key enforcement: Use `on_delete=models.PROTECT` or `on_delete=models.RESTRICT` on all relationship fields leading back to vendors or booked inventory.

---

### 6. Firebase Cloud Messaging (FCM) Integration Architecture

```
[Trigger: Booking / Payment Event]
                 |
        [Django Backend App]
                 |
  (Dispatches Async Celery Task)
                 |
       [Celery Worker Service]
                 |
     [Firebase Admin SDK (Python)]
                 |
     (FCM HTTP v1 Protocol)
                 |
    +------------+------------+
    |                         |
[Background Mode]       [Foreground Mode]
    |                         |
(Web Service Worker:    (Next.js Client Runtime:
firebase-messaging-sw)   onMessage Listener)
    |                         |
[System Notification OS] [In-App Toast UI (Shadcn)]

```

#### 6.1 Client Implementation Rules (Next.js)

1. **Service Worker Registration:** Deploy `firebase-messaging-sw.js` under the root `public/` directory using compatible scripts.
2. **Permission Workflow:**
* Prompt user for browser Notification permission using a dedicated Shadcn Dialog triggered upon first successful login or during checkout.
* On permission granted: Fetch `currentToken` from FCM via `getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })`.
* Immediately register token to Backend via `POST /api/v1/notifications/fcm/register/`.


3. **Foreground Message Listener:** Attach `onMessage(messaging, (payload) => { ... })` within an application-wide Context Provider. Display a floating Shadcn Toast component featuring an official Lucide Icon (e.g., `<CheckCircle2/>`, `<Bell/>`).

#### 6.2 Backend Implementation Rules (Django & Celery)

1. Initialize Firebase Admin SDK in `core/settings/base.py` via service account credentials JSON.
2. Maintain `fcm_device_tokens` table associating user IDs with multi-device tokens.
3. Structured Event Channels:
* `PAYMENT_CONFIRMED`: Sent to Tourist when Webhook verifies transaction.
* `NEW_BOOKING_ALERT`: Sent to Homestay, Restaurant, or Wellness owner when their item is successfully paid.
* `SLOT_REMINDER`: Scheduled push 2 hours before a Wellness session.
* `BOOKING_EXPIRING`: Sent 3 minutes before the 15-minute checkout TTL completes.



---

### 7. Mobile-First UX/UI Specifications & Icon Rules

#### 7.1 Viewport Breakpoints & Responsive Scaffold

* **Mobile-First Foundation (390px - 430px Viewport):**
* Maximum layout width for Tourist flow restricted to `max-w-md mx-auto` on larger screens to simulate an app shell experience, or expanded gracefully with fluid grids.
* Bottom Safe-Area Padding: `pb-[calc(env(safe-area-inset-bottom)+4rem)]` to prevent fixed Bottom Navigation from obscuring content.
* Touch Targets: All interactive components (Buttons, Select items, Time Slot chips) must satisfy minimum touch target dimensions of `44x44px`.


* **Sticky Transaction Footers:**
* Product, Room, and Cart details pages must implement a fixed bottom action panel (`fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background/95 backdrop-blur border-t p-4 z-40`).



#### 7.2 Strict Icon & Visual Typography Protocol

* **Icon System:** Exclusive use of `lucide-react`. No third-party emoji fonts, unicode emoji glyphs, or casual graphics are allowed in production markup.
* **Component-to-Icon Mapping Matrix:**
* Accommodations / Hotels: `<Hotel/>`, `<BedDouble/>`, `<CalendarDays/>`, `<Users/>`.
* Healthy Dining: `<UtensilsCrossed/>`, `<Salad/>`, `<Flame/>` (Calories), `<Apple/>`.
* Wellness / Spa: `<Sparkles/>`, `<Clock/>`, `<HeartPulse/>`, `<Bath/>`.
* OTOP Retail: `<ShoppingBag/>`, `<Package/>`, `<Tag/>`, `<Store/>`.
* Navigation Bar: `<Compass/>` (Explore), `<Search/>`, `<Bookmark/>`, `<Receipt/>` (Bookings), `<User/>`.
* Status Indicators: `<CheckCircle2/>` (Confirmed), `<AlertCircle/>` (Attention), `<Clock3/>` (Pending), `<XCircle/>` (Cancelled).
* Financial Actions: `<QrCode/>`, `<CreditCard/>`, `<ShieldCheck/>`.



---

### 8. Validation, Security & Error Handling Infrastructure

#### 8.1 Client-Side Form & Payload Validation (Zod Schemas)

* **Phone Schema:**
```typescript
export const ThaiPhoneRegex = /^0[689]\d{8}$/;
export const phoneSchema = z.string().regex(ThaiPhoneRegex, {
  message: "Invalid Thailand mobile number format (must be 10 digits starting with 06, 08, or 09)."
});

```


* **Date Range Validation:**
```typescript
export const bookingDateRangeSchema = z.object({
  checkInDate: z.date().refine((d) => d >= new Date(new Date().setHours(0,0,0,0)), {
    message: "Check-in date cannot be in the past."
  }),
  checkOutDate: z.date()
}).refine((data) => data.checkOutDate > data.checkInDate, {
  message: "Check-out date must be at least one day after check-in date.",
  path: ["checkOutDate"]
});

```



#### 8.2 Backend Error Normalizer (Django REST Framework)

* Create `common.exceptions.custom_exception_handler` to intercept `Http404`, `PermissionDenied`, and DRF `ValidationError`.
* Output guaranteed schema structure:
```python
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def standardized_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        customized_response = {
            "success": False,
            "error": {
                "code": exc.__class__.__name__.upper(),
                "details": response.data
            },
            "message": "An error occurred while processing the request."
        }
        response.data = customized_response
    else:
        response = Response({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "details": str(exc)
            },
            "message": "Critical unhandled server exception encountered."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response

```



#### 8.3 Payment Webhook Signature Validation

* Webhook endpoint `/api/v1/payments/webhooks/omise/` must verify incoming request authenticity:
1. Intercept raw HTTP body before JSON parsing.
2. Extract HMAC signature from header `X-Omise-Signature`.
3. Compute SHA-256 HMAC using configured secret key (`OMISE_WEBHOOK_SECRET_KEY`).
4. Compare signatures using `hmac.compare_digest()`. If mismatch, terminate connection immediately with `HTTP 401 Unauthorized`.
5. Process only verified `charge.complete` events within a database transaction. Update booking to `CONFIRMED` and trigger the `PAYMENT_CONFIRMED` FCM event.