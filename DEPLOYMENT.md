# 🚀 Production Deployment & Setup Guide

This full-stack **3D Digital Food Menu & Restaurant Ordering SaaS** is built with **Next.js (App Router), React, TypeScript, Tailwind CSS, Three.js, and Supabase**.

---

## 🛠️ Step 1: Set Up Your Supabase Project

1. Go to [Supabase Dashboard](https://database.new) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon / Public Key** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   - **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) *(Keep this private; server-side only)*

3. Go to the **SQL Editor** in your Supabase project dashboard:
   - Open and run the contents of [`supabase/migrations/001_initial.sql`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/supabase/migrations/001_initial.sql) to create all database tables.
   - Open and run the contents of [`supabase/policies.sql`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/supabase/policies.sql) to enable multi-tenant Row Level Security (RLS).

---

## 💻 Step 2: Local Environment Configuration

Copy `.env.example` to `.env.local` inside the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run the local development server:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the SaaS landing page, register a test restaurant (`/signup`), or access the hotel dashboard (`/dashboard`).

---

## 🌐 Step 3: Deploy to Vercel

1. Push this project repository to your GitHub account.
2. Go to [Vercel Dashboard](https://vercel.com/new) and select **Import Repository**.
3. Under **Environment Variables**, add the 3 variables:

| Key | Value | Context |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` *(or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)* | `your-anon-key` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Production (Secret) |
| `NEXT_PUBLIC_SITE_URL` *(Optional)* | `https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app` | Production |

4. Click **Deploy**. Vercel will build and deploy your single full-stack application.

---

## 🔐 Step 4: Configure Supabase Authentication Redirect URLs

In your [Supabase Project Dashboard](https://supabase.com/dashboard):
1. Navigate to **Authentication** ➔ **URL Configuration**.
2. Set **Site URL** to:
   ```text
   https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app
   ```
3. Under **Redirect URLs**, add:
   ```text
   https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app/**
   https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app/auth/callback
   https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app/dashboard
   https://*-kingcinematics4-7720s-projects.vercel.app/**
   http://localhost:3000/**
   ```
4. Click **Save**. This ensures Supabase email confirmation links redirect to the deployed website rather than `localhost:3000`.

---

## 🏷️ Step 5: Connecting a Custom Domain (Optional Later)

When you purchase a custom domain later:

1. Open your Vercel Project Settings ➔ **Domains**.
2. Enter your custom domain (e.g., `menu.yourrestaurant.com` or `yourrestaurant.com`).
3. In your Domain Registrar (Namecheap, GoDaddy, Cloudflare, etc.), add the DNS record:
   - **Type**: `CNAME`
   - **Name**: `menu` (or `@` for root)
   - **Value**: `cname.vercel-dns.com`
4. Update the **Custom Domain** field in your Hotel Dashboard Settings (`/dashboard/settings`).

---

## 📊 Summary of SaaS Architecture & Routes

- **Landing Page**: [`/`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/page.tsx)
- **Hotel Onboarding & Registration**: [`/signup`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/signup/page.tsx)
- **Hotel Login**: [`/login`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/login/page.tsx)
- **Protected Hotel Dashboard**: [`/dashboard`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/dashboard/page.tsx)
  - 3D Menu & Dish Manager: [`/dashboard/menu`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/dashboard/menu/page.tsx)
  - Kitchen Display System (KDS): [`/dashboard/orders`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/dashboard/orders/page.tsx)
  - QR Code & Standee Builder: [`/dashboard/qr`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/dashboard/qr/page.tsx)
  - Analytics & Revenue Intelligence: [`/dashboard/analytics`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/dashboard/analytics/page.tsx)
  - Customer Reviews: [`/dashboard/reviews`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/dashboard/reviews/page.tsx)
  - Profile & Branding Settings: [`/dashboard/settings`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/dashboard/settings/page.tsx)
- **Public Customer 3D Menu**: [`/menu/[slug]?table=X`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/menu/%5Bslug%5D/page.tsx)
- **Live Order Status Tracking**: [`/order-status/[orderId]`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/app/order-status/%5BorderId%5D/page.tsx)
