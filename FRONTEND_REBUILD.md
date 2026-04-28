# ThriftStore Frontend Rebuild Guide

Stack: **Next.js (App Router) + Tailwind CSS**

---

## 1. Setup

```bash
npx create-next-app@latest thrift-frontend --ts --tailwind --app --src-dir
cd thrift-frontend
```

- **Dev port**: `3001` (`package.json` dev script: `next dev -p 3001`)
- **API base**: `http://localhost:8001/api/v1`
- **Image base**: `http://localhost:8001/storage`
- **Env**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STORAGE_URL`

---

## 2. API Client

Use `axios` with a thin wrapper. Base URL from `NEXT_PUBLIC_API_URL`.

- Interceptor attaches `Authorization: Bearer <token>` from localStorage
- On 401 → clear token, redirect to `/auth/login`
- On 403 with "blocked" message → show blocked screen

### Response envelope (all endpoints)

```typescript
interface ApiResponse<T> {
  data: T
  meta: { message: string }
  errors: Record<string, string[]> | []
}
```

### Paginated response

When the endpoint is paginated (e.g., listings index), `data` contains:

```typescript
interface PaginatedData<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  per_page: number
  total: number
  // ... other Laravel pagination fields
}
```

---

## 3. Auth Flow

- **JWT** stored in `localStorage`, key: `token`
- **TTL**: 60 min, **refresh window**: 14 days
- On app load, check for token and call `POST /auth/refresh` if near expiry
- `logout` → blacklists token, clears localStorage, redirects to `/auth/login`

---

## 4. Pages & Routes

### 4.1 Public Pages

| Route | Page | API Endpoints | Notes |
|-------|------|---------------|-------|
| `/` | Landing / Home | none (static hero) | Tagline, CTA to Browse, maybe featured listings carousel |
| `/search` | Search & Browse | `GET /listings?q=&category_id=&min_price=&max_price=&condition=&sort=&page=` | Paginated grid, sidebar filters, search bar. URL query params sync. |
| `/listings/[id]` | Listing Detail | `GET /listings/{id}` | Photos, seller info, condition, price, "I'm interested" button |

### 4.2 Auth Pages

| Route | Page | API Endpoints | Notes |
|-------|------|---------------|-------|
| `/auth/login` | Login | `POST /auth/login` | Email + password form |
| `/auth/register` | Register | `POST /auth/register` | Name, email, phone, password (with strength validation) |

### 4.3 Authenticated Pages (add `useAuth` middleware)

| Route | Page | API Endpoints | Notes |
|-------|------|---------------|-------|
| `/dashboard/buyer` | Buyer Dashboard | `GET /listings?interested_buyer_id={myId}` | Listings I'm interested in. Withdraw interest. |
| `/dashboard/seller` | Seller Dashboard | `GET /my-listings?status=` | My listings by status tab. Create new, manage. |
| `/listings/create` | Create Listing | `POST /listings`, `GET /categories` | Form with 3-5 image uploads, details |
| `/listings/[id]/edit` | Edit Listing | `PUT /listings/{id}`, `GET /categories` | Edit title, desc, price, condition, category |
| `/listings/success` | Payment Success | `POST /payments/verify?session_id=` | After Stripe redirect |
| `/profile` | My Profile | `GET /profile`, `POST /profile`, `POST /profile/change-password` | Edit name, phone, photo; change password |
| `/notifications` | Notifications | `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` | Paginated list with unread count badge in navbar |

### 4.4 Admin Pages

| Route | Page | API Endpoints | Notes |
|-------|------|---------------|-------|
| `/admin` | Dashboard | `GET /admin/stats` | Stats cards |
| `/admin/users` | Manage Users | `GET /admin/users?q=&role=&is_blocked=` | Paginated list, block/unblock |
| `/admin/listings` | Manage Listings | `GET /admin/listings?status=&q=` | Paginated, archive/restore |
| `/admin/reports` | Manage Reports | `GET /admin/reports?status=&target_type=` | Resolve with action |
| `/admin/reviews` | Manage Reviews | through reports flow | Remove reviews |
| `/admin/categories` | Manage Categories | `POST /admin/categories`, `PUT /admin/categories/{id}` | CRUD |
| `/admin/payments` | Payments Overview | `GET /admin/payments?status=&q=` | Summary + paginated list |
| `/admin/audit-log` | Audit Log | `GET /admin/audit-log` | Paginated |

---

## 5. Component Architecture

```
components/
├── layout/
│   ├── Navbar.tsx          # Logo, nav links, auth buttons, notification bell
│   ├── Footer.tsx
│   └── AuthGuard.tsx       # Redirects to /auth/login if not authed
├── listings/
│   ├── ListingCard.tsx     # Grid card: image, title, price, condition, location
│   ├── ListingForm.tsx     # Create/edit form (reused)
│   ├── ImageUploader.tsx   # Drag-and-drop, 3-5 image preview, validation
│   ├── ListingDetail.tsx   # Full listing view with photo gallery
│   └── StatusBadge.tsx     # Colored badge for listing status
├── search/
│   ├── SearchFilters.tsx   # Sidebar: category, condition, price range, sort
│   ├── ActiveFilters.tsx   # Chip row with removable filters
│   └── SearchHeader.tsx    # Search input + sort dropdown
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Badge.tsx
│   ├── Spinner.tsx
│   ├── EmptyState.tsx
│   ├── Notice.tsx          # Info/warning/success/error banner
│   └── Pagination.tsx      # Page numbers with prev/next
├── reviews/
│   ├── ReviewCard.tsx
│   └── ReviewForm.tsx
├── payments/
│   └── CheckoutButton.tsx  # Calls POST /payments/checkout, redirects to Stripe
└── notifications/
    └── NotificationList.tsx
```

---

## 6. State Management

Recommendation: **Zustand** (lightweight, no boilerplate).

Stores:

### `useAuthStore`
```
token: string | null
user: { user_id, name, email, phone, role, profile_photo_url } | null
login(email, password) → void
register(name, email, phone, password) → void
logout() → void
hydrate() → void          // restore from localStorage on mount
```

### `useNotificationStore`
```
unreadCount: number
fetchUnreadCount() → void
```

---

## 7. Key Flows

### 7.1 Listing Lifecycle

```
Create listing (POST /listings) → status = "draft"
  │
  ▼
Pay fee (POST /payments/checkout) → Stripe Checkout
  │
  ▼
Redirect back → POST /payments/verify → status = "active"
  │
  ▼
Someone clicks "I'm Interested" → PATCH /listings/{id}/status { status: "interested" }
  │  → notification: interest_received (seller), interest_sent (buyer)
  ▼
Seller confirms → PATCH /listings/{id}/status { status: "sold" }
  │  → notification: listing_sold (buyer)
  ▼
Buyer reviews (POST /reviews)
```

### 7.2 Payment Flow (Stripe)

1. `GET /payments/due` → shows draft listings + total fee
2. User selects listings → `POST /payments/checkout` with `{ listing_ids: [...] }`
3. Backend returns `{ checkout_url: "https://checkout.stripe.com/..." }`
4. Frontend redirects to Stripe
5. On success → Stripe redirects to `/listings/success?session_id=xxx`
6. Frontend calls `POST /payments/verify` with `{ session_id }`
7. Backend verifies with Stripe, activates listings
8. Redirect to `/dashboard/seller` with success toast

### 7.3 Interest Flow

- On listing detail page, "I'm Interested" button calls `PATCH /listings/{id}/status { status: "interested" }`
- Interested buyer appears on seller's dashboard
- Seller can: confirm sale (`status: "sold"`) or do nothing
- Buyer can withdraw (`PATCH /listings/{id}/status { status: "active" }`)
- Once sold, only the buyer can review the listing

### 7.4 Image Handling

- Listings: 3-5 images, multipart upload to `POST /listings`
- Profile photo: single image upload to `POST /profile`
- Backend stores to `storage/app/public/listings/` or `profile_photos/`
- URLs are relative: `/storage/listings/filename.jpg`
- Prep `NEXT_PUBLIC_STORAGE_URL` (e.g. `http://localhost:8001`) to form full URLs
- Display: `<Image src={`${storageUrl}${imagePath}`} ... />` with Next.js Image component
- Configure `remotePatterns` in `next.config.ts` to allow the storage domain

---

## 8. Tailwind Design Tokens

Define these in `globals.css` using `@theme` (Tailwind v4):

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand` | `#1a6b4a` | Primary actions, active state |
| `--color-brand-hover` | `#155a3e` | Hover state |
| `--color-brand-light` | `#e8f5ee` | Subtle brand background |
| `--color-bg-base` | `#f7f6f2` | Page background |
| `--color-bg-card` | `#ffffff` | Card surfaces |
| `--color-bg-card-alt` | `#f0efe9` | Alternative surface |
| `--color-text-primary` | `#1a1917` | Headings, body |
| `--color-text-secondary` | `#5c5a55` | Secondary text |
| `--color-text-muted` | `#9c9a94` | Placeholder, disabled |
| `--color-border` | `#e2e0d8` | Default borders |
| `--color-border-focus` | `#1a6b4a` | Focus ring |
| `--color-success` | `#1a6b4a` | Success state |
| `--color-danger` | `#b91c1c` | Error state |
| `--color-warning` | `#7a4f00` | Warning state |
| `--color-info` | `#1e4fa8` | Info state |
| `--radius-sm` | `6px` | |
| `--radius-md` | `10px` | |
| `--radius-lg` | `16px` | |
| `--radius-xl` | `24px` | |

---

## 9. Responsive Breakpoints

- **Mobile**: default (< 640px)
- **Tablet**: `sm:` (640px+)
- **Desktop**: `md:` (768px+)
- **Wide**: `lg:` (1024px+)

Search sidebar collapses below `sm:`. Listing grid is 2 cols on mobile, 3 on desktop.

---

## 10. Useful Next.js Config

`next.config.ts`:
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8001' },
    ],
  },
}
```

---

## 11. npm Dependencies

```json
{
  "next": "^16",
  "react": "^19",
  "axios": "^1",
  "zustand": "^5",
  "tailwindcss": "^4",
  "react-dropzone": "^14",
  "react-hot-toast": "^2"
}
```

---

## 12. Page Design Details

### `/search` — Browse & Filter Listings

- **Header**: sticky search bar with text input + sort dropdown
- **Sidebar** (desktop) / collapsible (mobile):
  - Category list (from `GET /categories`)
  - Condition buttons (New, Like New, Good, Fair)
  - Price range (min/max inputs)
- **Main**: paginated grid of `ListingCard`s
- **Active filters**: chips row with "Clear all" button
- **Empty state**: search icon + "No results found" + "Clear all filters"
- **Loading**: 6 skeleton cards (pulse animation)
- **URL sync**: `?q=&category_id=&min_price=&max_price=&condition=&sort=&page=`

### `/listings/[id]` — Single Listing

- **Photo gallery**: main image + thumbnails
- **Details**: title, price, condition badge, location, description
- **Seller info**: name, photo, rating, member since
- **Actions**:
  - Authenticated, not owner → "I'm Interested" button
  - Owner → "Edit" button
  - Already interested → "Withdraw interest" button
- **Reviews section**: rating stars, comment, seller response

### `/dashboard/seller` — Seller Dashboard

- **Tabs**: Active, Draft, Interested, Sold, Archived
- **Each tab**: grid of listings with status badge
- **Draft tab**: "Pay to publish" button → checkout flow
- **Interested tab**: shows buyer name + contact info
- **"+ New Listing"** button → `/listings/create`

### `/dashboard/buyer` — Buyer Dashboard

- **Listings I'm interested in**: grid with status badges
- **Withdraw**: cancel interest on active/in-progress items
- **Review**: button on sold items to leave a review

### `/listings/create` — Create Listing

- **Form fields**: title, description, price, condition (select), category (select), location
- **Image uploader**: drag-and-drop, 3-5 required, previews, remove
- **Submit**: creates as draft, redirects to seller dashboard
- **Then**: user pays to publish (shown in draft tab with "Pay" button)

### `/admin` — Admin Dashboard

- **Stats cards**: total users, active listings, revenue, pending reports, blocked users
- **Sidebar nav**: Dashboard, Users, Listings, Reports, Payments, Audit Log, Categories
- Each page: paginated table with search/filter + action buttons
