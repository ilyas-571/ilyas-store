# Ilyas Store - Complete Project Documentation

This document serves as the comprehensive guide to the Ilyas Store workspace. It details the architecture, feature set, database schema, API design, and what is potentially missing or open for future development. 

## 1. Project Overview & Architecture

Ilyas Store is a modern, luxury eCommerce platform designed for selling physical products like perfumes, watches, and cosmetics. It is structured as a **pnpm monorepo** to share code (like API types, schemas, and database access) seamlessly between the frontend and backend.

### Tech Stack:
- **Frontend:** React 19, Vite 7, wouter (routing), Tailwind CSS v4, shadcn/ui, Radix UI.
- **Backend:** Node.js 18+, Express 5, TypeScript.
- **Database:** PostgreSQL with Drizzle ORM.
- **API Layer:** OpenAPI 3.0 Specification.
- **Code Generation:** 
  - `orval` generates React Query hooks for the frontend.
  - `orval` generates Zod schemas for validation.

---

## 2. Workspace Structure

The project is divided into `artifacts` (deployable apps) and `lib` (shared packages).

```
ilyas-store/
├── artifacts/
│   ├── api-server/         # Backend: Express API handling all logic and DB ops.
│   └── ilyas-store/        # Frontend: React + Vite application.
├── lib/
│   ├── api-client-react/   # Generated React Query hooks used by the frontend.
│   ├── api-spec/           # openapi.yaml - The single source of truth for the API.
│   ├── api-zod/            # Generated Zod validation schemas based on the OpenAPI spec.
│   └── db/                 # Drizzle ORM config, schemas, and migrations.
├── database/               # SQL dumps for database restoration.
└── scripts/                # Utility scripts (e.g., setup.sh).
```

### How the Data Flows:
1. You define the endpoint in `lib/api-spec/openapi.yaml`.
2. Running `pnpm --filter @workspace/api-spec run codegen` automatically generates hooks in `lib/api-client-react` and schemas in `lib/api-zod`.
3. The frontend uses the generated hooks (e.g., `useGetProducts()`) to fetch data.
4. The backend imports the generated Zod schemas to validate incoming requests.

---

## 3. Database Schema

The database is powered by PostgreSQL and managed by Drizzle ORM (`lib/db/src/schema`). The core tables include:

- **users**: Stores user accounts (id, email, password_hash, role: 'admin' | 'user', etc.).
- **categories**: Product categories (id, name, slug, image_url, order_index).
- **products**: Core product data (id, category_id, name, description, price, original_price, stock, images array, variations).
- **orders & order_items**: Stores transaction details, customer addresses, totals, and statuses (pending, processing, shipped, delivered, cancelled).
- **reviews**: User reviews for products, calculating average ratings.
- **banners**: Homepage carousel banners.
- **coupons**: Discount codes (percentage or fixed amount, usage limits, expiry).
- **ads_feed_settings / ads_tracking**: Settings for Facebook/Google Ads pixel tracking and product feeds.
- **settings**: Global store settings like name, logo, contact info.

---

## 4. Frontend Application (`artifacts/ilyas-store`)

The storefront is a SPA built with Vite.

### Core Pages & Routes:
- `/` - Homepage featuring banners, category grid, and featured products.
- `/products` - Product listing page with category filtering and sorting.
- `/products/:id` - Detailed product view with image gallery, variant selection (size/color), and review section.
- `/cart` - Shopping cart modal/page.
- `/checkout` - Multi-step checkout process (Customer Info -> Shipping -> Payment).
- `/orders` & `/orders/:id` - Customer order history and printable invoice.
- `/login` & `/register` - User authentication.
- `/admin/*` - Admin dashboard protecting routes exclusively for `role: 'admin'`.

### Features Implemented:
- **Responsive Design**: Mobile-first luxury UI, sticky "Add to Cart" bars on mobile.
- **State Management**: `React Query` for server state, local React Context/Hooks for Cart state.
- **Dynamic Variants**: Size and color selection dynamically adjusting price and stock.
- **Cart & Wishlist**: Persistent cart functionality.
- **Admin Dashboard**: Comprehensive CMS to manage the store.

---

## 5. Backend Server (`artifacts/api-server`)

The API server connects to the PostgreSQL DB and provides endpoints to the frontend.

### Core Features:
- **Authentication:** JWT-based stateless authentication. Passwords hashed with `bcrypt`.
- **Authorization:** Middleware checks if `req.user` is present, and if `req.user.role === 'admin'` for admin routes.
- **Validation:** Every request is validated against Zod schemas generated from OpenAPI.
- **Error Handling:** Standardized error responses (400 for validation, 401/403 for auth, 404 for not found, 500 for server errors).

---

## 6. What is Included (Working Features)

✅ **Storefront UI**: Fully responsive, luxury aesthetic.
✅ **Product Management**: Variations (sizes/colors), pricing, image galleries, stock tracking.
✅ **Cart & Checkout**: Multi-step checkout with Cash on Delivery (COD) support.
✅ **Admin CMS**: Create/edit products, manage categories, banners, and coupons.
✅ **Order Management**: Change order statuses, view order details, print invoices.
✅ **Reviews System**: Users can leave 1-5 star reviews on products.
✅ **Marketing/Ads Tracking**: Admin pages for FB Pixel / Google Analytics and product feed generation.
✅ **Monorepo Tooling**: Shared types and automated code generation via OpenAPI.

---

## 7. What Might Be Missing (Gap Analysis for the User)

Based on a standard eCommerce platform, here are features you might want to implement next or verify:

1. **Payment Gateway Integration**: Currently, it relies heavily on Cash on Delivery (COD). Integrations with Stripe, PayPal, or local gateways (e.g., PayFast, JazzCash) might be needed if you want online card payments.
2. **Email / SMS Notifications**: Sending automated emails or SMS for "Order Confirmation", "Shipping Updates", or "Password Resets" using services like Resend, SendGrid, Twilio, or AWS SES.
3. **Advanced Product Filters**: Price range sliders, brand filtering, or dynamic attribute filtering on the `/products` page. Currently it filters by category.
4. **Wishlist Persistence**: The wishlist button on the product detail page currently just uses local component state (or local storage). Saving wishlists to the database requires a `wishlists` table for logged-in users.
5. **Inventory Management Logic**: Automatically deducting stock from `product_variations` when an order is placed (and restoring stock if cancelled). You should verify that the backend `POST /api/orders` endpoint correctly decrements stock.
6. **SEO (Search Engine Optimization)**: Since it's a Vite SPA, SEO relies on client-side rendering. If SEO is critical, you might need to add SSR (Server Side Rendering) or pre-rendering.
7. **Image Upload Service**: Integrating an S3 bucket, Cloudinary, or UploadThing for direct image uploads from the Admin panel rather than relying on local server uploads or manual URLs.

---

## 8. Development Workflow & Commands

### Running the App
1. Open terminal in `artifacts/api-server` and run: `pnpm run dev`
2. Open terminal in `artifacts/ilyas-store` and run: `pnpm run dev`

### Modifying the Database
1. Update schema files in `lib/db/src/schema/*.ts`.
2. Run `pnpm --filter @workspace/db run push` to sync changes to PostgreSQL.

### Modifying the API
1. Edit `lib/api-spec/openapi.yaml`.
2. Run `pnpm --filter @workspace/api-spec run codegen`.
3. Implement the logic in `artifacts/api-server/src/routes/`.
4. Use the new React Query hook in `artifacts/ilyas-store`.

---
*Generated by AI Assistant on May 3, 2026*
