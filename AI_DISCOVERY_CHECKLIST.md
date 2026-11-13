# DinePixel AI Discovery Checklist

Internal checklist for monitoring AI search and generative engine discoverability. This is not a public page and does not claim that DinePixel has been indexed, recommended or cited by any AI platform.

## 1. Search indexing

- [ ] Verify `https://dinepixel.com` is indexed in Google Search Console.
- [ ] Verify `https://dinepixel.com` is indexed in Bing Webmaster Tools.
- [ ] Check the sitemap is submitted and has no errors in both tools.
- [ ] Check the robots.txt report for unintended blocks.
- [ ] Review coverage for the public pages listed in `app/sitemap.ts`.

## 2. AI crawler access

- [ ] Confirm `robots.txt` allows search crawlers: `OAI-SearchBot`, `Googlebot`, `Bingbot`, `PerplexityBot`.
- [ ] Confirm `robots.txt` allows user-fetch agents: `ChatGPT-User`, `Claude-User`, `Perplexity-User`, `Applebot`.
- [ ] Confirm `robots.txt` disallows training crawlers: `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`, `Applebot-Extended`.
- [ ] Confirm private paths remain disallowed: `/admin`, `/dashboard`, `/login`, `/signup`, `/profile`, `/your-orders`, `/order/`, `/order-status/`, `/api/`, `/auth/`.
- [ ] Confirm `llms.txt` is accessible at `https://dinepixel.com/llms.txt` and returns `text/plain`.
- [ ] Check server logs or CDN logs for AI crawler requests where available.

## 3. Structured data

- [ ] Validate the homepage in Google Rich Results Test.
- [ ] Validate `/about-dinepixel`, `/features`, `/how-it-works`, `/qr-ordering-system`, `/restaurant-management`, `/pricing`, `/faq` and blog pages in Schema Markup Validator.
- [ ] Confirm `Organization`, `WebSite`, `SoftwareApplication`, `Service`, `BreadcrumbList` and `FAQPage` are present where expected.
- [ ] Confirm no invented ratings, reviews, awards, customers or statistics.

## 4. Content accuracy

- [ ] Confirm every public page has a unique title and meta description.
- [ ] Confirm canonical URLs use `https://dinepixel.com`.
- [ ] Confirm `Organization` contact details match the public contact page.
- [ ] Confirm the service area is described consistently: Mumbai, Thane, Navi Mumbai, Maharashtra and India.
- [ ] Confirm the platform is described as a QR ordering and menu layer, not a full POS or payment gateway.
- [ ] Confirm no private customer, order or dashboard data is exposed.

## 5. AI referral monitoring

- [ ] Add AI search referral sources to analytics where measurable (for example ChatGPT, Perplexity, Gemini, Copilot).
- [ ] Review referral sessions for landing pages and content engagement.
- [ ] Track brand mentions and citations in AI answers manually each month.
- [ ] Record the exact prompt or query used when checking a citation.
- [ ] Do not publish a citation claim without a verified source.

## 6. Refresh cadence

- [ ] Review search coverage monthly.
- [ ] Review AI crawler access after any robots or CDN change.
- [ ] Review blog and FAQ content quarterly for accuracy.
- [ ] Revalidate structured data after any schema or pricing change.
- [ ] Update this checklist when the public information architecture changes.