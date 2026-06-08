# Custom T-Shirt Order Platform — Implementation Plan

## Context

A B2B SaaS web app sold to T-shirt printing companies. Each company gets a white-labeled platform where their customers can log in, upload a PNG design, pick a shirt color, position/resize/rotate the design on a live mockup, and place an order. The company gets a dashboard to view new orders, preview designs, and download the print-ready PNG. Must run on free/open-source hosting to keep initial costs near zero (just a domain ~$10–15/year).

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 App Router + TypeScript** | Unified frontend + API routes, zero extra server, perfect Vercel fit |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, accessible, no licensing cost |
| Canvas | **Fabric.js** | Industry standard for drag/resize/rotate on canvas; handles clipping, JSON serialization |
| Auth | **NextAuth.js v5** | Email+password, free, no external auth service |
| ORM | **Prisma** | Type-safe DB access, great migration tooling |
| Database | **Neon (PostgreSQL)** | Serverless Postgres, free tier (512MB), native Vercel integration |
| File Storage | **Cloudinary** | Free tier (25GB storage/bandwidth), CDN delivery, signed uploads via server |
| Hosting | **Vercel** | Free tier, auto-deploys from GitHub, zero-config Next.js |

**Total monthly cost: ~$0** (domain ~$10–15/year)

---

## Project Folder Structure

```
Custom-Tshirt-Order/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                      # Seeds initial ADMIN user
├── public/
│   └── mockups/
│       ├── tshirt-white.svg
│       ├── tshirt-black.svg
│       ├── tshirt-navy.svg
│       ├── tshirt-red.svg
│       └── tshirt-grey.svg
└── src/
    ├── app/
    │   ├── (auth)/login/page.tsx
    │   ├── (auth)/register/page.tsx
    │   ├── (customer)/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx              # Landing "/"
    │   │   ├── design/page.tsx       # Canvas customizer
    │   │   └── orders/
    │   │       ├── page.tsx          # Order history
    │   │       └── [id]/page.tsx     # Order detail (read-only canvas)
    │   ├── (admin)/admin/
    │   │   ├── orders/page.tsx       # All orders table
    │   │   └── orders/[id]/page.tsx  # Order detail + status update
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts
    │       ├── auth/register/route.ts
    │       ├── upload/route.ts
    │       ├── orders/route.ts
    │       ├── orders/[id]/route.ts
    │       └── admin/orders/route.ts
    │           admin/orders/[id]/route.ts
    ├── components/
    │   ├── canvas/
    │   │   ├── TshirtCanvas.tsx      # Core Fabric.js component (dynamic import, ssr:false)
    │   │   ├── CanvasToolbar.tsx     # Rotate/scale/center/delete
    │   │   ├── ColorPicker.tsx       # Color swatches
    │   │   └── ImageUploader.tsx     # Drop zone → POST /api/upload
    │   ├── admin/
    │   │   ├── AdminOrdersTable.tsx
    │   │   └── StatusUpdateDropdown.tsx
    │   └── layout/
    │       ├── Navbar.tsx
    │       └── AdminSidebar.tsx
    ├── hooks/
    │   └── useCanvas.ts              # Fabric.js state management
    ├── lib/
    │   ├── auth.ts                   # NextAuth config
    │   ├── prisma.ts                 # Prisma singleton
    │   ├── cloudinary.ts             # Cloudinary SDK config
    │   └── validations.ts            # Zod schemas
    ├── types/
    │   └── next-auth.d.ts            # Extend session with id + role
    └── middleware.ts                 # Route protection
```

---

## Database Schema (Prisma)

```prisma
model User {
  id       String  @id @default(cuid())
  name     String?
  email    String  @unique
  password String                       // bcrypt hashed
  role     Role    @default(CUSTOMER)
  orders   Order[]
  // + NextAuth: Account, Session, VerificationToken tables
}

model Order {
  id             String      @id @default(cuid())
  userId         String
  user           User        @relation(...)
  tshirtColor    String                 // "white" | "black" | "navy" | "red" | "grey"
  imagePublicId  String                 // Cloudinary public_id (for deletion/transforms)
  imageUrl       String                 // Cloudinary CDN URL (for display/download)
  canvasState    Json                   // Full fabric.canvas.toJSON() — source of truth
  placementX     Float                  // Denormalized: left % of canvas width
  placementY     Float                  // top % of canvas height
  placementScale Float                  // scaleX (uniform scaling enforced)
  placementAngle Float                  // rotation degrees
  status         OrderStatus @default(PENDING)
  notes          String?                // Customer notes
  adminNotes     String?                // Internal only
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

enum Role        { CUSTOMER  ADMIN }
enum OrderStatus { PENDING  IN_PROGRESS  COMPLETED  CANCELLED }
```

---

## Canvas Architecture (Most Complex Feature)

**TshirtCanvas layers (bottom → top):**
1. T-shirt SVG mockup — `fabric.Image`, non-selectable, non-movable
2. Clipping `fabric.Rect` matching the printable chest area
3. Customer design — `fabric.Image`, fully interactive (drag/resize/rotate)

**Critical: Fabric.js crashes SSR.** Must use:
```ts
const TshirtCanvas = dynamic(() => import('@/components/canvas/TshirtCanvas'), { ssr: false })
```

**Color switching:** Swap the background SVG URL, reload it as `fabric.Image` without touching the design layer.

**Canvas JSON round-trip:** Only serialize the design layer. On load (order detail page), re-load the SVG mockup first, then call `canvas.loadFromJSON()` for the design layer.

**Printable area constraints:** Hardcoded pixel constants in `useCanvas.ts` matching the SVG geometry. The `object:moving` event enforces bounds.

---

## Key API Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create user (bcrypt hash) |
| POST | `/api/upload` | Customer | Upload PNG → Cloudinary server-side |
| POST | `/api/orders` | Customer | Save order with canvasState JSON |
| GET | `/api/orders` | Customer | Own order history |
| GET | `/api/orders/[id]` | Customer (owner) | Single order detail |
| GET | `/api/admin/orders` | Admin | All orders, filter by status |
| GET | `/api/admin/orders/[id]` | Admin | Order detail + user info |
| PATCH | `/api/admin/orders/[id]` | Admin | Update status / adminNotes |

**Never expose Cloudinary API secret to client.** All uploads route through the Next.js API.

---

## End-to-End Upload → Canvas → Order Flow

```
File selected → client validates (PNG, ≤10MB)
  → POST /api/upload → Cloudinary SDK (server) → { publicId, url }
  → fabric.Image.fromURL(url) → auto-scaled into print area, centered
  → User drags/resizes/rotates
  → "Place Order" clicked
  → Collect: color + publicId + url + canvas.toJSON() + placement values
  → POST /api/orders → DB record created
  → Admin sees order in dashboard
  → Admin clicks order → canvas.loadFromJSON(canvasState) renders exact preview
  → Admin downloads via <a href={imageUrl} download>
```

---

## Implementation Phases

### Phase 1 — Prototype (Basic CSS, Core Flow Working)
Goal: get every feature functional end-to-end with zero visual polish. Validates the full stack before investing in UI.

| Step | Work |
|---|---|
| 1.1 | `create-next-app` scaffold, install all dependencies, configure `.env.local` |
| 1.2 | Prisma schema → Neon DB migration, Cloudinary + NextAuth wired up |
| 1.3 | `/register` and `/login` pages — plain HTML forms, NextAuth credentials provider |
| 1.4 | `POST /api/upload` → Cloudinary server-side upload working |
| 1.5 | Fabric.js canvas on `/design` — SVG mockup loads, user PNG loads, basic drag/resize/rotate |
| 1.6 | Color picker swaps SVG mockup; printable-area movement constraint enforced |
| 1.7 | `POST /api/orders` saves canvasState JSON + all placement fields to DB |
| 1.8 | `/orders` list and `/orders/[id]` read-only canvas replay working |
| 1.9 | Admin: `/admin/orders` table + `/admin/orders/[id]` with status update + image download |
| 1.10 | `prisma db seed` creates one ADMIN user; middleware route protection tested |

**Deliverable:** Every user story works. Styling is plain Tailwind utility classes only — no custom components, no design system, no animations.

---

### Phase 2 — Backend Hardening
Goal: production-grade API layer before touching the UI.

| Step | Work |
|---|---|
| 2.1 | Zod validation on every API route (body, params, query) |
| 2.2 | Ownership checks on `GET /api/orders/[id]` (user can't access other users' orders) |
| 2.3 | File validation hardening: PNG-only enforced server-side (not just client), 10MB cap |
| 2.4 | Cloudinary folder structure: `tshirt-designs/{userId}/{orderId}` |
| 2.5 | Pagination on admin orders list (`?page=&limit=`) |
| 2.6 | Status filter on admin orders (`?status=PENDING`) via URL search params |
| 2.7 | `adminNotes` field: admin can write internal notes on an order |
| 2.8 | Error handling: consistent `{ error: string }` JSON responses, correct HTTP status codes |
| 2.9 | NextAuth session includes `user.id` and `user.role` (extend `next-auth.d.ts`) |
| 2.10 | Vercel deploy with all env vars; `prisma migrate deploy` in build step; smoke test |

**Deliverable:** All API routes are validated, secured, and handle edge cases. App is live on Vercel with custom domain.

---

### Phase 3 — Stunning UI
Goal: production-quality visual design that can be shown to paying customers.

| Step | Work |
|---|---|
| 3.1 | Install and init shadcn/ui; replace all raw HTML elements with shadcn components |
| 3.2 | Landing page (`/`) — hero section, feature highlights, CTA, sample mockup screenshots |
| 3.3 | Auth pages — centered card layout, logo, clean form styling, loading spinner on submit |
| 3.4 | `/design` page — two-column layout: canvas left, controls right sidebar; floating `CanvasToolbar` appears on object select |
| 3.5 | Canvas polish: smooth transition on color swap, snap-to-center button, rotation angle displayed |
| 3.6 | Color picker — large clickable swatches with checkmark on active, color name label |
| 3.7 | Image uploader — drag-and-drop zone with dashed border, upload progress bar, thumbnail preview after upload |
| 3.8 | Order confirmation — modal dialog with order ID, estimated timeline, link to order history |
| 3.9 | Customer `/orders` — card grid with design thumbnail, color dot, status badge (colored), date |
| 3.10 | Admin dashboard — sidebar navigation, stats cards (total / pending / in-progress counts), sortable orders table |
| 3.11 | Admin order detail — full-width canvas preview, customer info panel, prominent download button, status timeline |
| 3.12 | Global: Sonner toast notifications (success/error), Suspense skeletons for all async data, responsive mobile layout |

---

## Required Environment Variables

Neon provides **two** connection strings — use both:

| Variable | Neon label | Purpose |
|---|---|---|
| `DATABASE_URL` | **Pooled Connection** | Used by the running Next.js app. Routes through PgBouncer — queues concurrent requests from many users and safely recycles a small pool of DB connections. Pass this to Prisma in production. |
| `DATABASE_URL_UNPOOLED` | **Direct Connection** | Bypasses PgBouncer. Required by Prisma Migrate and `db seed` — these commands need a persistent, non-pooled session. Never use this at runtime. |

```
# .env.local

# Neon — Pooled (app runtime)
DATABASE_URL="postgresql://user:pass@ep-xxx.pooler.neon.tech/neondb?sslmode=require"

# Neon — Direct (migrations + seed only)
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET=                       # openssl rand -base64 32
NEXTAUTH_URL=                          # http://localhost:3000 (prod: https://yourdomain.com)

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=    # Safe to expose (display only)
```

**Prisma schema config — wire both URLs:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")           // pooled — used by Prisma Client at runtime
  directUrl = env("DATABASE_URL_UNPOOLED")  // direct — used by prisma migrate & db push
}
```

**Vercel deploy:** Add both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in the Vercel environment variables dashboard. Neon's official Vercel integration sets these automatically if you connect the projects through the integration page.

---

## Verification Checklist

- [ ] Register → login → session persists → logout clears session
- [ ] `/design` redirects to `/login` when unauthenticated
- [ ] `/admin/*` redirects non-ADMIN users to `/`
- [ ] Upload PNG → appears on canvas centered in print area
- [ ] Drag design — cannot move outside printable area
- [ ] Switch shirt color → SVG swaps, design stays in place
- [ ] Place order → DB record created, `canvasState` JSON stored
- [ ] `/orders` shows only current user's orders
- [ ] `/admin/orders` shows all orders with status filter
- [ ] Admin order detail renders canvas exactly matching customer's placement
- [ ] Download link fetches the PNG from Cloudinary CDN
- [ ] Status update (PENDING → IN_PROGRESS → COMPLETED) persists
- [ ] `npx prisma migrate deploy` runs cleanly on Vercel build
