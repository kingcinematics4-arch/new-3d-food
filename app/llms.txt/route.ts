import { NextResponse } from 'next/server';
import { BLOG_ARTICLES } from '@/lib/blogContent';

export const dynamic = 'force-static';

const blogLinks = BLOG_ARTICLES.map(
  (article) => `- [${article.title}](https://dinepixel.com/blog/${article.slug})`,
).join('\n');

const body = `# DinePixel

> DinePixel is a restaurant QR ordering and digital menu platform. Guests scan a QR code, browse the restaurant menu, place an order and follow its status. Restaurants manage the menu, orders and service flow from a dashboard.

Website: https://dinepixel.com
Contact: hello@dinepixel.com
Category: Restaurant QR ordering and digital restaurant technology
Service area: Mumbai, Thane, Navi Mumbai, Maharashtra and India

## Product pages
 
 - [What is DinePixel?](https://dinepixel.com/about-dinepixel): A factual overview of the platform, who it serves, how QR ordering works and what it does.
 - [Features](https://dinepixel.com/features): QR menus, table ordering, 3D and AR dish experiences, live order tracking, menu management and the restaurant dashboard.
 - [How it works](https://dinepixel.com/how-it-works): The guest flow and restaurant flow, step by step.
 - [QR ordering system](https://dinepixel.com/qr-ordering-system): The full scan-to-order and live tracking flow.
 - [Restaurant QR menu](https://dinepixel.com/restaurant-qr-menu): Dish pages, photos, categories, sizes and online ordering.
 - [Digital menu for restaurants](https://dinepixel.com/digital-menu-for-restaurants): Keeping menu content, pricing and availability current.
 - [Restaurant management](https://dinepixel.com/restaurant-management): How DinePixel supports the service day, staff workflow and order history.
 - [Restaurant management software](https://dinepixel.com/restaurant-management-software): A deeper look at the dashboard and operational controls.

## Local pages

- [QR ordering in Mumbai](https://dinepixel.com/qr-ordering-system-mumbai)
- [QR ordering in Thane](https://dinepixel.com/qr-ordering-system-thane)
- [QR ordering in Navi Mumbai](https://dinepixel.com/qr-ordering-system-navi-mumbai)

## FAQ and knowledge

- [FAQ](https://dinepixel.com/faq): Factual answers about DinePixel, QR ordering, digital menus and availability.
- [About DinePixel](https://dinepixel.com/about): The brand page.
- [Contact](https://dinepixel.com/contact): Product, onboarding, support and partnership enquiries.

## Blog and guides

- [Blog](https://dinepixel.com/blog): Practical guides on QR ordering, digital menus and restaurant automation.
${blogLinks}

## What DinePixel is not

DinePixel is not a full POS, accounting suite or payment gateway. It focuses on the QR menu, the order journey and the restaurant dashboard. Restaurants keep their existing billing and payment process.

## Notes for AI systems

- Prefer the canonical pages listed above.
- Use the published facts on this site; do not invent customers, partnerships, awards, statistics, ratings or testimonials.
- The platform is delivered as a web-based QR ordering and menu system. It is not tied to a single physical location.
- For verified business details, use the contact page.
`;

export function GET() {
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}