# 🚀 Production Deployment & Setup Guide

This full-stack **3D Digital Food Menu & Restaurant Ordering SaaS** is built with **Next.js (App Router), React, TypeScript, Tailwind CSS, Three.js, and Supabase**.

---

## 🛠︝ Step 1: Set Up Your Supabase Project

1. Go to [Supabase Dashboard](https://database.new) and create a new project.
2. Under **Project Settings -> API**, copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon / Public Key** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   - **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) *(Keep this private; server-side only)*

3. Go to the **SQL Editor** in your Supabase project dashboard:
   - Open and run the contents of [`supabase/migrations/001_initial.sql`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/supabase/migrations/001_initial.sql) to create all database tables (safe to re-run).
   - Open and run the contents of [`supabase/migrations/002_auth_identity_and_menu_fields.sql`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/supabase/migrations/002_auth_identity_and_menu_fields.sql) to add the auth-identity, menu and review fields (safe to re-run).
   - Open and run the contents of [`supabase/migrations/004_admin_site_content.sql`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/supabase/migrations/004_admin_site_content.sql) to add the Dine3D admin website content store and the admin session revocation marker (safe to re-run). **Required for the `/admin` panel to save or publish.** Until it is applied, `/admin` still loads and the public website still works; only saving and publishing report that the migration is missing.
   - Open and run the contents of [`supabase/migrations/005_branding_storage.sql`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/supabase/migrations/005_branding_storage.sql) to create the public read-only `dine3d-branding` storage bucket (safe to re-run). **Required for the logo upload in `/admin/branding` and `/admin/media`.** Until it is applied the site keeps showing the bundled `public/images/dine3d-logo.png`, and uploading reports `Storage bucket "dine3d-branding" does not exist`. Depends on 004, so run it after 004.
   - Open and run [`supabase/verify_branding_storage.sql`](file:///c:/Users/jay%20subhash%20vare/OneDrive/Desktop/new%203d%20food/supabase/verify_branding_storage.sql) to confirm the bucket exists, is public, and has no write policies (read-only; safe to run any time).
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

## 🌝 Step 3: Deploy to Vercel

1. Push this project repository to your GitHub account.
2. Go to [Vercel Dashboard](https://vercel.com/new) and select **Import Repository**.
3. Under **Environment Variables**, add the 3 variables:

| Key | Value | Context |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` *(or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)* | `your-anon-key` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Production (Secret) |
| `NEXT_PUBLIC_SITE_URL` | `https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app` | Production |

> `NEXT_PUBLIC_SITE_URL` pins the base URL used inside Supabase confirmation
> emails. If it is not set, the app falls back to the Vercel deployment URL
> variables and finally to the hardcoded production URL - it never emits
> `localhost` on Vercel. Leave it unset locally so `http://localhost:3000`
> keeps working during development.

4. Click **Deploy**. Vercel will build and deploy your single full-stack application.

---

## 🔝 Step 4: Configure Supabase Authentication Redirect URLs

In your [Supabase Project Dashboard](https://supabase.com/dashboard):
1. Navigate to **Authentication** ➔ **URL Configuration**.
2. Set **Site URL** to:
   ```text
   https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app
   ```
   > The Site URL is the fallback Supabase uses whenever a supplied
   > `emailRedirectTo` is not allow-listed. If this still says
   > `http://localhost:3000`, every confirmation link will point at localhost.
3. Under **Redirect URLs**, add exactly these:
   ```text
   https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app/auth/callback
   https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app/**
   https://*-kingcinematics4-7720s-projects.vercel.app/**
   http://localhost:3000/**
   ```
   > The first entry is mandatory and must match `emailRedirectTo` character for
   > character - it carries no query string, which is why the wildcard entry
   > alone is not enough. `http://localhost:3000/**` is only for local `next dev`
   > testing and is ignored in production.
4. Click **Save**.

### Resulting email confirmation flow

```text
User clicks "Confirm Email"
  -> Supabase confirms the address
  -> redirects to  https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app/auth/callback?token_hash=...&type=signup
  -> /auth/callback exchanges the token for a session and sets the session cookies
  -> redirects to  https://new-3d-food-jz4ddpgn2-kingcinematics4-7720s-projects.vercel.app/dashboard
```

---

## 🝷︝ Step 5: Connecting a Custom Domain (Optional Later)

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
---

## ?? Dine3D Owner Admin Panel (`/admin`)

A separate admin surface for controlling the **public Dine3D website**. It is completely
independent of the Supabase authentication used by restaurant owners: no Supabase session can
open `/admin`, and an admin session cannot open `/dashboard`.

### Environment variables (server-side only � never prefix with `NEXT_PUBLIC_`)

| Variable | Purpose |
| --- | --- |
| `DINE3D_ADMIN_PASSWORD` | Owner password for `/admin`. Compared on the server only; the browser never receives or evaluates it. While unset, `/admin` stays locked and shows a setup notice. |
| `DINE3D_ADMIN_SESSION_SECRET` | Optional. Signs the session cookie with HMAC-SHA256 so the key can be rotated without changing the password. If omitted, the key is derived from `DINE3D_ADMIN_PASSWORD`. |

Changing either value invalidates all existing admin sessions.

### Adding these to Vercel (required for the deployed app)

`DINE3D_ADMIN_PASSWORD` works locally only because it lives in `.env.local`, which is gitignored.
**Vercel does not read `.env.local`.** A local admin login tells you nothing about whether the
deployed app is configured.

If `/admin/login` on the deployed site shows *"Admin access is not configured�"*, the variable is
missing from the deployed environment. The comparison stays server-side; nothing about the
architecture changes.

1. Open the **Vercel Dashboard** ? your project ? **Settings** ? **Environment Variables**.
2. Add `DINE3D_ADMIN_PASSWORD` with the owner password. Use the **same value you use locally** if
   you want one password across both.
3. **Tick the `Production` environment checkbox.** This is the step that is most often missed: a
   variable added only under `Preview` is absent from the production deployment, which then reports
   itself as unconfigured. Tick `Preview` and `Development` too if you want admin to work on
   preview deployments.
4. Optionally add `DINE3D_ADMIN_SESSION_SECRET` as a long random string so the signing key can be
   rotated without changing the password. Generate one with `openssl rand -base64 32`. If you set it
   locally too, use the same value in both places.
5. **Redeploy.** Vercel only applies new environment variables to a *new* deployment. Go to the
   **Deployments** tab ? **?** on the current production deployment ? **Redeploy**. Pushing a new
   commit works too.

Never prefix these with `NEXT_PUBLIC_`. Next.js inlines any `NEXT_PUBLIC_*` variable into the
client bundle at build time, which would publish the owner password to every visitor. The app reads
`DINE3D_ADMIN_PASSWORD` from `process.env` on the server at request time, which is why a redeploy �
not a cache clear � is what picks up a new value.

To confirm the deployed app is configured without revealing anything, open
`https://<your-domain>/api/admin/auth/session`: `"configured": true` means the variable reached the
server. It returns booleans and an expiry only, never any secret.

### Local vs production behaviour

| | `DINE3D_ADMIN_PASSWORD` source | Cookie `secure` flag |
| --- | --- | --- |
| Local (`npm run dev`) | `.env.local` | `false` (plain HTTP on localhost) |
| Vercel production | Vercel server environment variable | `true` (HTTPS only) |

The cookie is always `httpOnly`, `sameSite=lax`, `path=/` and expires after 8 hours. On production
it is additionally `secure`, so it is only ever transmitted over HTTPS.

### How access is protected

1. `middleware.ts` verifies the HMAC signature and expiry of the `dine3d_admin_session` cookie (Edge-safe Web Crypto).
2. `app/admin/(panel)/layout.tsx` calls `requireAdminPage()` on the server, so an unauthenticated request is redirected before any admin markup is produced.
3. Every `/api/admin/*` route calls `requireAdminApi()` and returns 401 otherwise.
4. Logout writes a revocation timestamp, so session tokens issued at or before that moment stay invalid even if a copy of the cookie was captured beforehand.

Failed logins are rate limited per client (`lib/adminThrottle.ts`) to slow password guessing.

### Required migration

Run `supabase/migrations/004_admin_site_content.sql`. It adds two RLS-enabled, policy-free tables
(`site_content` and `admin_session_state`) that only the server-side service role can reach. It
does not modify any restaurant table.

### Draft vs published

Edits are saved as a draft. The public `/` page renders only the published document, so nothing
becomes visible to visitors until **Publish Changes** is pressed.

### Build note

`next dev` writes to `.next-dev` and `next build` writes to `.next`. Running a production
build while the dev server is up can no longer corrupt the dev server's route manifests.