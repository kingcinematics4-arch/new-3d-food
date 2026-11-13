import type { IconName } from './siteContent';

export interface SeoFeature {
  icon: IconName;
  title: string;
  description: string;
}

export interface SeoStep {
  label: string;
  description: string;
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoRelatedLink {
  href: string;
  label: string;
  description: string;
}

export interface SeoPageContent {
  slug: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  metaTitle: string;
  metaDescription: string;
  heroDescription: string;
  intro: string[];
  highlights: string[];
  features: SeoFeature[];
  workflowTitle: string;
  workflow: SeoStep[];
  faqTitle: string;
  faqs: SeoFaq[];
  relatedTitle: string;
  related: SeoRelatedLink[];
  serviceType: string;
  areaServed: string[];
}

const india = ['Mumbai', 'Thane', 'Navi Mumbai', 'Maharashtra', 'India'];

export const SEO_PAGES: Record<string, SeoPageContent> = {
  'qr-ordering-system': {
    slug: '/qr-ordering-system',
    navLabel: 'QR Ordering System',
    eyebrow: 'QR ORDERING',
    title: 'A QR ordering system that covers the whole table journey.',
    titleAccent: 'Scan, order, track, serve.',
    metaTitle: 'QR Ordering System for Restaurants | DinePixel',
    metaDescription:
      'A complete QR ordering system for restaurants: scan-to-order menus, table ordering, live order tracking and a restaurant dashboard. Built for dine-in, takeaway and multi-location teams.',
    heroDescription:
      'DinePixel gives every table a QR entry point into your menu, cart and live order tracking. Guests order from their phones; your team manages every order from one dashboard.',
    intro: [
      'A QR ordering system is only useful when it fits the way a restaurant actually works. DinePixel connects the guest menu, the order and the staff view in one flow, so an order placed at table 12 is visible to the kitchen and the floor without a phone call or a paper ticket.',
      'The experience is mobile-first. Guests scan a table QR code, browse the menu, choose sizes and notes, place the order and follow its status. Restaurants get a live order board, menu controls and order history in the same dashboard.',
    ],
    highlights: [
      'No app download for guests',
      'Table-aware QR links',
      'Live order status',
      'Item notes and sizes',
      'Menu availability controls',
      'Order history and reporting',
    ],
    features: [
      {
        icon: 'qr',
        title: 'QR table ordering',
        description:
          'Each table gets a QR link to the right menu. Guests scan with a phone camera and start browsing without installing anything.',
      },
      {
        icon: 'grid',
        title: 'A digital menu that stays current',
        description:
          'Update dishes, prices, categories and availability from the dashboard. The guest menu reflects the change without a reprint.',
      },
      {
        icon: 'clock',
        title: 'Live order tracking',
        description:
          'Guests can follow the order from placed to preparing, ready, completed or cancelled while staff update the same status.',
      },
      {
        icon: 'layers',
        title: 'One order dashboard',
        description:
          'See new orders, item details, notes and totals in a single live view. Staff can accept, prepare and complete orders without switching tools.',
      },
      {
        icon: 'utensils',
        title: 'Menu and item controls',
        description:
          'Manage categories, dish descriptions, photos, sizes, pricing and availability. Sold-out items can be hidden without deleting them.',
      },
      {
        icon: 'palette',
        title: 'A branded guest experience',
        description:
          'Use your restaurant name, logo, colours and menu style so the QR menu feels like an extension of the room, not a generic form.',
      },
    ],
    workflowTitle: 'How a QR order moves through DinePixel',
    workflow: [
      {
        label: 'Scan',
        description: 'The guest scans the table QR code and opens the restaurant menu.',
      },
      {
        label: 'Browse',
        description: 'They explore categories, dish details, photos and available sizes.',
      },
      {
        label: 'Order',
        description: 'They add items, notes and quantities to the cart and place the order.',
      },
      {
        label: 'Track',
        description: 'The guest sees the order status update as the restaurant moves it forward.',
      },
      {
        label: 'Manage',
        description: 'Staff handle the order from the dashboard and keep the menu current.',
      },
    ],
    faqTitle: 'QR ordering questions, answered.',
    faqs: [
      {
        question: 'Does the guest need to download an app?',
        answer:
          'No. The QR code opens the menu in the phone browser. Guests can browse and order without installing a separate app.',
      },
      {
        question: 'Can each table have its own QR code?',
        answer:
          'Yes. DinePixel supports table-aware QR links, so a scan can open the menu for the correct table and carry that table context into the order.',
      },
      {
        question: 'Can guests add notes or choose sizes?',
        answer:
          'Yes. Item-level notes, quantities and size options are part of the ordering flow, subject to how the restaurant has configured its menu.',
      },
      {
        question: 'How do orders reach the restaurant team?',
        answer:
          'Orders appear in the restaurant dashboard. Staff can see the items, notes and total, then update the order status as it moves through preparation and service.',
      },
      {
        question: 'Can I use DinePixel for takeaway as well as dine-in?',
        answer:
          'Yes. The same menu and ordering flow can be used for takeaway. Dine-in orders can use table QR codes, while takeaway orders can use a general menu link.',
      },
      {
        question: 'Is DinePixel a replacement for my billing system?',
        answer:
          'DinePixel focuses on QR menus, ordering and order management. It is designed to sit alongside the restaurant’s existing billing and payment process rather than replace it.',
      },
    ],
    relatedTitle: 'Explore the DinePixel platform',
    related: [
      {
        href: '/restaurant-qr-menu',
        label: 'Restaurant QR menu',
        description: 'See how dish pages, photos, 3D views and categories work for guests.',
      },
      {
        href: '/digital-menu-for-restaurants',
        label: 'Digital menu for restaurants',
        description: 'Learn how to keep menu content, pricing and availability current.',
      },
      {
        href: '/restaurant-management-software',
        label: 'Restaurant management software',
        description: 'Explore the dashboard, order board and operational controls.',
      },
      {
        href: '/features',
        label: 'All DinePixel features',
        description: 'A complete view of the ordering, menu and restaurant tools.',
      },
    ],
    serviceType: 'Restaurant QR ordering system',
    areaServed: india,
  },

  'restaurant-qr-menu': {
    slug: '/restaurant-qr-menu',
    navLabel: 'Restaurant QR Menu',
    eyebrow: 'RESTAURANT QR MENU',
    title: 'A restaurant QR menu that feels like part of the meal.',
    titleAccent: 'Rich dishes. No app.',
    metaTitle: 'Restaurant QR Menu with 3D and Online Ordering | DinePixel',
    metaDescription:
      'Restaurant QR menu with photos, 3D dish views, categories, sizes and online ordering. Give guests a rich digital menu without an app download.',
    heroDescription:
      'A QR menu should do more than show a list. DinePixel gives each dish a clear page, useful detail and an easy path to order, all from a phone camera scan.',
    intro: [
      'Most QR menus are a PDF behind a code. DinePixel treats the menu as a product: categories, dish pages, photos, descriptions, sizes, availability and ordering all live in the same experience.',
      'Guests can scan, explore and order without leaving the browser. Restaurants keep the menu editable, so a seasonal dish, a price change or a sold-out item can be handled in minutes.',
    ],
    highlights: [
      'Dish-level detail, not just a PDF',
      'Photos and optional 3D views',
      'Categories and menu structure',
      'Sizes, notes and availability',
      'Online ordering from the menu',
      'Mobile-first layout',
    ],
    features: [
      {
        icon: 'qr',
        title: 'A QR entry point for every table',
        description:
          'Guests scan the code at the table and land directly on the restaurant menu. No app store visit and no separate login for browsing.',
      },
      {
        icon: 'camera',
        title: 'Photos that help guests choose',
        description:
          'Add dish photography so guests can see what they are ordering. Images sit alongside the description, price and available options.',
      },
      {
        icon: 'cube',
        title: 'Optional 3D dish views',
        description:
          'Where a restaurant has a 3D model, guests can inspect the dish from different angles. The 3D view is an enhancement, not a requirement.',
      },
      {
        icon: 'grid',
        title: 'Categories and menu structure',
        description:
          'Group dishes into sections that match how the restaurant serves them, from starters and mains to drinks and desserts.',
      },
      {
        icon: 'utensils',
        title: 'Sizes, notes and availability',
        description:
          'Show portion options, item notes and sold-out states so guests can make a clear choice before they add an item to the cart.',
      },
      {
        icon: 'bolt',
        title: 'Ordering without friction',
        description:
          'The menu and cart are connected. Guests can add items, review the order and send it to the restaurant without a separate ordering tool.',
      },
    ],
    workflowTitle: 'What the guest sees',
    workflow: [
      {
        label: 'Scan',
        description: 'The guest scans the QR code and opens the menu in the browser.',
      },
      {
        label: 'Explore',
        description: 'They move through categories and open dishes that look interesting.',
      },
      {
        label: 'Choose',
        description: 'They review the description, photo, size and price, then add the item.',
      },
      {
        label: 'Order',
        description: 'They check the cart, add notes if needed and send the order to the restaurant.',
      },
    ],
    faqTitle: 'QR menu questions, answered.',
    faqs: [
      {
        question: 'Is a QR menu just a PDF?',
        answer:
          'No. DinePixel uses a structured menu with categories, dish pages, prices, options and ordering. A PDF can be a fallback, but the DinePixel menu is designed to be interactive.',
      },
      {
        question: 'Can I add photos to my dishes?',
        answer:
          'Yes. Dish images are part of the menu item content and help guests understand what they are ordering.',
      },
      {
        question: 'Do I need 3D models for every dish?',
        answer:
          'No. 3D is optional. A restaurant can run a complete QR menu with photos and descriptions, and add 3D models only where they add value.',
      },
      {
        question: 'Can I hide a dish when it is sold out?',
        answer:
          'Yes. Availability controls let the restaurant hide or mark items without deleting the dish from the menu permanently.',
      },
      {
        question: 'Can guests order directly from the QR menu?',
        answer:
          'Yes. The menu is connected to the ordering flow, so guests can add items to a cart and place an order from the same experience.',
      },
      {
        question: 'Will it work on older phones?',
        answer:
          'DinePixel is built mobile-first and uses the phone browser. The core menu and ordering experience is designed to work without requiring a new device.',
      },
    ],
    relatedTitle: 'Go deeper on menus and ordering',
    related: [
      {
        href: '/qr-ordering-system',
        label: 'QR ordering system',
        description: 'See the full scan-to-order and live tracking flow.',
      },
      {
        href: '/digital-menu-for-restaurants',
        label: 'Digital menu for restaurants',
        description: 'Learn how to keep menu content and availability up to date.',
      },
      {
        href: '/qr-ordering-system-mumbai',
        label: 'QR ordering in Mumbai',
        description: 'A local view of QR menus for high-volume Mumbai restaurants.',
      },
      {
        href: '/features',
        label: 'All DinePixel features',
        description: 'Explore menu, ordering and dashboard capabilities.',
      },
    ],
    serviceType: 'Restaurant QR menu',
    areaServed: india,
  },

  'digital-menu-for-restaurants': {
    slug: '/digital-menu-for-restaurants',
    navLabel: 'Digital Menu for Restaurants',
    eyebrow: 'DIGITAL MENU',
    title: 'A digital menu that stays current.',
    titleAccent: 'Update once. Every table sees it.',
    metaTitle: 'Digital Menu for Restaurants | DinePixel',
    metaDescription:
      'Digital menu for restaurants with instant updates, photos, categories, pricing and QR access. Manage your menu from one dashboard and keep every table in sync.',
    heroDescription:
      'Paper menus go stale. DinePixel keeps the menu in one place, so a price change, a new dish or a sold-out item reaches every QR code without a reprint.',
    intro: [
      'A digital menu is an operational tool, not just a design project. DinePixel gives restaurants a structured menu they can edit, publish and control from the dashboard, with the guest view updating from the same source.',
      'The result is fewer printing cycles, fewer version mismatches and a menu that reflects what the kitchen can actually serve today.',
    ],
    highlights: [
      'Edit menu content from one dashboard',
      'Instant updates for every QR code',
      'Categories, photos and descriptions',
      'Pricing, sizes and availability',
      'No reprinting for daily changes',
      'Consistent menu across tables',
    ],
    features: [
      {
        icon: 'bolt',
        title: 'Instant menu updates',
        description:
          'Change a dish, price or availability and the guest menu reflects it without reprinting a paper copy.',
      },
      {
        icon: 'grid',
        title: 'A structured menu builder',
        description:
          'Organise dishes into categories, add descriptions and keep the menu easy to scan on a phone.',
      },
      {
        icon: 'camera',
        title: 'Photos and dish detail',
        description:
          'Give each dish a clear visual and enough detail for guests to choose with confidence.',
      },
      {
        icon: 'utensils',
        title: 'Pricing, sizes and options',
        description:
          'Keep prices and portion options in the menu so the guest sees the right choice at the point of ordering.',
      },
      {
        icon: 'clock',
        title: 'Availability controls',
        description:
          'Hide sold-out items or mark them unavailable without deleting the dish from the menu.',
      },
      {
        icon: 'palette',
        title: 'Brand-consistent presentation',
        description:
          'Match the menu to the restaurant’s logo, colours and style instead of using a generic template.',
      },
    ],
    workflowTitle: 'How the menu stays in sync',
    workflow: [
      {
        label: 'Build',
        description: 'Create the menu structure, dishes, prices and descriptions in the dashboard.',
      },
      {
        label: 'Publish',
        description: 'Make the menu available to the restaurant’s QR codes and guest links.',
      },
      {
        label: 'Update',
        description: 'Change availability, pricing or content as the service day changes.',
      },
      {
        label: 'Monitor',
        description: 'Use order activity and menu interactions to see what guests are choosing.',
      },
    ],
    faqTitle: 'Digital menu questions, answered.',
    faqs: [
      {
        question: 'How quickly can I update the menu?',
        answer:
          'Menu changes are made in the dashboard and reflected in the guest menu. The exact timing depends on the restaurant’s publishing workflow and any caching in front of the site.',
      },
      {
        question: 'Do I need to reprint QR codes when the menu changes?',
        answer:
          'No. The QR code points to the restaurant menu, not to a printed snapshot. The menu content can change while the QR code stays the same.',
      },
      {
        question: 'Can I manage more than one menu?',
        answer:
          'DinePixel is built around restaurant accounts and menu content. Multi-location groups can discuss the right setup for their locations with the team.',
      },
      {
        question: 'Do guests need an app to view the digital menu?',
        answer:
          'No. The menu opens in the phone browser after a QR scan. No separate app download is required for browsing.',
      },
      {
        question: 'Can I keep paper menus as well?',
        answer:
          'Yes. A digital menu can sit alongside printed menus. Many restaurants use the QR menu for daily changes and keep a smaller printed selection for guests who prefer paper.',
      },
      {
        question: 'Does the digital menu handle ordering too?',
        answer:
          'Yes. The menu is connected to the DinePixel ordering flow, so guests can add items to a cart and place an order from the same experience.',
      },
    ],
    relatedTitle: 'Related menu and ordering guides',
    related: [
      {
        href: '/restaurant-qr-menu',
        label: 'Restaurant QR menu',
        description: 'See how the guest menu experience is put together.',
      },
      {
        href: '/qr-ordering-system',
        label: 'QR ordering system',
        description: 'Explore the full ordering and live tracking flow.',
      },
      {
        href: '/restaurant-management-software',
        label: 'Restaurant management software',
        description: 'See how menu controls fit into the wider dashboard.',
      },
      {
        href: '/features',
        label: 'All DinePixel features',
        description: 'A complete view of the platform.',
      },
    ],
    serviceType: 'Digital menu for restaurants',
    areaServed: india,
  },

  'qr-ordering-system-thane': {
    slug: '/qr-ordering-system-thane',
    navLabel: 'QR Ordering in Thane',
    eyebrow: 'THANE',
    title: 'QR ordering for restaurants in Thane.',
    titleAccent: 'From café counter to full table service.',
    metaTitle: 'QR Ordering System in Thane | DinePixel',
    metaDescription:
      'QR ordering system in Thane for cafes, restaurants and cloud kitchens. Scan-to-order menus, table ordering, live order tracking and a simple restaurant dashboard.',
    heroDescription:
      'Thane’s dining rooms range from quick-service counters to full-service restaurants. DinePixel gives each format a practical QR ordering flow without forcing every venue into the same template.',
    intro: [
      'A café with six tables and a multi-floor restaurant have different service rhythms. DinePixel keeps the basics consistent: a QR menu, a clear cart, an order that reaches the team and a status the guest can follow.',
      'Restaurants in Thane can use table QR codes for dine-in service and a general menu link for takeaway. Menu updates, item notes and availability controls are handled from the same dashboard.',
    ],
    highlights: [
      'Table QR codes for dine-in',
      'Takeaway menu links',
      'Live order board',
      'Menu updates without reprints',
      'Order history for the team',
      'Works for small and large formats',
    ],
    features: [
      {
        icon: 'qr',
        title: 'Table QR ordering',
        description:
          'Place a QR code on each table and let guests open the menu, order and track the order from their phone.',
      },
      {
        icon: 'bolt',
        title: 'Takeaway ordering',
        description:
          'Use a general menu link for takeaway customers who want to order without sitting at a table.',
      },
      {
        icon: 'clock',
        title: 'Live order tracking',
        description:
          'Keep the guest informed as the order moves from placed to preparing, ready and completed.',
      },
      {
        icon: 'grid',
        title: 'Menu control',
        description:
          'Update dishes, prices and availability from the dashboard so the menu matches what the kitchen can serve.',
      },
      {
        icon: 'layers',
        title: 'A simple order dashboard',
        description:
          'See new orders, item notes and totals in one place, then update the status as the team works through them.',
      },
      {
        icon: 'chart',
        title: 'Order history',
        description:
          'Keep a record of orders and menu activity to understand what guests are choosing over time.',
      },
    ],
    workflowTitle: 'A service day with DinePixel in Thane',
    workflow: [
      {
        label: 'Set the table',
        description: 'Each table has a QR code that opens the restaurant menu.',
      },
      {
        label: 'Take the order',
        description: 'The guest browses, chooses items and sends the order from the table.',
      },
      {
        label: 'Update the status',
        description: 'The team moves the order through preparation and service on the dashboard.',
      },
      {
        label: 'Close the loop',
        description: 'The guest sees the final status and the restaurant keeps an order record.',
      },
    ],
    faqTitle: 'Thane restaurant questions',
    faqs: [
      {
        question: 'Do you work with restaurants in Thane?',
        answer:
          'DinePixel is built for restaurants across Thane and the wider Mumbai region. The platform is delivered as a web-based QR ordering and menu system, so it does not depend on a single physical location.',
      },
      {
        question: 'Can a small café use DinePixel?',
        answer:
          'Yes. The core flow is designed to work for small menus and small teams. A café can start with a QR menu and table ordering, then add more menu content as needed.',
      },
      {
        question: 'Can I use it for takeaway in Thane?',
        answer:
          'Yes. Takeaway orders can use a general menu link instead of a table QR code. The same menu and order dashboard apply.',
      },
      {
        question: 'Can I manage more than one outlet?',
        answer:
          'DinePixel supports restaurant accounts and menu content. For multi-outlet groups, the right setup depends on how the locations and menus are managed; the team can help scope that.',
      },
      {
        question: 'Does DinePixel replace my billing system?',
        answer:
          'No. DinePixel focuses on QR menus, ordering and order management. Billing and payment reconciliation stay with the restaurant’s existing process.',
      },
      {
        question: 'Do guests need to download an app?',
        answer:
          'No. The QR code opens the menu in the phone browser, so guests can browse and order without installing an app.',
      },
    ],
    relatedTitle: 'Nearby and related guides',
    related: [
      {
        href: '/qr-ordering-system-mumbai',
        label: 'QR ordering in Mumbai',
        description: 'A view of QR ordering for high-volume Mumbai restaurants.',
      },
      {
        href: '/qr-ordering-system-navi-mumbai',
        label: 'QR ordering in Navi Mumbai',
        description: 'QR ordering for cafes and restaurants across Navi Mumbai.',
      },
      {
        href: '/qr-ordering-system',
        label: 'QR ordering system',
        description: 'The full product overview and ordering flow.',
      },
      {
        href: '/restaurant-management-software',
        label: 'Restaurant management software',
        description: 'See the dashboard and operational controls.',
      },
    ],
    serviceType: 'QR ordering system in Thane',
    areaServed: ['Thane', 'Maharashtra', 'India'],
  },

  'qr-ordering-system-navi-mumbai': {
    slug: '/qr-ordering-system-navi-mumbai',
    navLabel: 'QR Ordering in Navi Mumbai',
    eyebrow: 'NAVI MUMBAI',
    title: 'A simpler way to take orders in Navi Mumbai.',
    titleAccent: 'Built for busy services.',
    metaTitle: 'QR Ordering System in Navi Mumbai | DinePixel',
    metaDescription:
      'QR ordering system in Navi Mumbai for restaurants, cafes and cloud kitchens. Digital menus, table ordering, live order tracking and dashboard management.',
    heroDescription:
      'Navi Mumbai’s cafés, quick-service counters and cloud kitchens need an ordering flow that keeps up without adding complexity. DinePixel keeps the guest path short and the staff view clear.',
    intro: [
      'From a busy breakfast service to a late-night takeaway rush, the basics matter: the guest can scan, the menu is current, the order reaches the team and the status is visible.',
      'DinePixel gives restaurants in Navi Mumbai a QR menu, table-aware ordering, live order tracking and a dashboard that does not require a separate app for guests.',
    ],
    highlights: [
      'QR menu for dine-in and takeaway',
      'Table-aware ordering',
      'Live order status',
      'Menu updates in one place',
      'Order history',
      'Mobile-first guest experience',
    ],
    features: [
      {
        icon: 'qr',
        title: 'Scan-to-order',
        description:
          'Guests scan a QR code and open the menu in the browser. The path from scan to order stays short.',
      },
      {
        icon: 'grid',
        title: 'Digital menu',
        description:
          'Keep categories, dishes, prices and availability current without reprinting a paper menu.',
      },
      {
        icon: 'clock',
        title: 'Live order tracking',
        description:
          'Show guests where their order is while the team updates the same status from the dashboard.',
      },
      {
        icon: 'layers',
        title: 'Order dashboard',
        description:
          'See incoming orders, item notes and totals in one view so the team can respond quickly.',
      },
      {
        icon: 'chart',
        title: 'Order history',
        description:
          'Keep a record of orders and menu activity for a clearer view of what guests are choosing.',
      },
      {
        icon: 'globe',
        title: 'Works across formats',
        description:
          'Use the same platform for a café, a quick-service counter or a cloud kitchen with a takeaway menu link.',
      },
    ],
    workflowTitle: 'From scan to served',
    workflow: [
      {
        label: 'Scan',
        description: 'The guest opens the menu from a table QR code or a takeaway link.',
      },
      {
        label: 'Choose',
        description: 'They browse the menu, review dish details and add items to the cart.',
      },
      {
        label: 'Order',
        description: 'The order reaches the restaurant dashboard with the table or takeaway context.',
      },
      {
        label: 'Track',
        description: 'The guest follows the status while the team moves the order forward.',
      },
    ],
    faqTitle: 'Navi Mumbai restaurant questions',
    faqs: [
      {
        question: 'Do you work with restaurants in Navi Mumbai?',
        answer:
          'Yes. DinePixel is built for restaurants across Navi Mumbai and the wider Mumbai region. It is a web-based QR ordering and menu platform, so it is not tied to a single physical location.',
      },
      {
        question: 'Can a cloud kitchen use DinePixel?',
        answer:
          'Yes. A cloud kitchen can use a general menu link for takeaway orders and the same dashboard to manage incoming orders and menu content.',
      },
      {
        question: 'Can I use table QR codes for dine-in service?',
        answer:
          'Yes. Table-aware QR links let each table open the menu with the right table context for the order.',
      },
      {
        question: 'Can I update the menu during service?',
        answer:
          'Yes. Menu and availability changes are made in the dashboard, so the guest menu can reflect what is available without a reprint.',
      },
      {
        question: 'Does DinePixel handle payments?',
        answer:
          'DinePixel focuses on ordering and order management. Payment collection and reconciliation remain part of the restaurant’s existing process.',
      },
      {
        question: 'Do guests need an app?',
        answer:
          'No. The QR code opens the menu in the phone browser, so guests can browse and order without installing an app.',
      },
    ],
    relatedTitle: 'Nearby and related guides',
    related: [
      {
        href: '/qr-ordering-system-thane',
        label: 'QR ordering in Thane',
        description: 'QR ordering for cafes and restaurants in Thane.',
      },
      {
        href: '/qr-ordering-system-mumbai',
        label: 'QR ordering in Mumbai',
        description: 'QR ordering for high-volume Mumbai restaurants.',
      },
      {
        href: '/qr-ordering-system',
        label: 'QR ordering system',
        description: 'The full product overview and ordering flow.',
      },
      {
        href: '/digital-menu-for-restaurants',
        label: 'Digital menu for restaurants',
        description: 'Keep menu content and availability current.',
      },
    ],
    serviceType: 'QR ordering system in Navi Mumbai',
    areaServed: ['Navi Mumbai', 'Maharashtra', 'India'],
  },

  'qr-ordering-system-mumbai': {
    slug: '/qr-ordering-system-mumbai',
    navLabel: 'QR Ordering in Mumbai',
    eyebrow: 'MUMBAI',
    title: 'Built for the pace of Mumbai dining.',
    titleAccent: 'Premium QR ordering, without the friction.',
    metaTitle: 'QR Ordering System in Mumbai | DinePixel',
    metaDescription:
      'Premium QR ordering system in Mumbai for restaurants, hotels and multi-outlet groups. Scan-to-order menus, table ordering, live order tracking and analytics.',
    heroDescription:
      'Mumbai service moves quickly. DinePixel gives restaurants a QR ordering flow that keeps the guest path simple and the staff view current, from a single café to a multi-outlet group.',
    intro: [
      'High-volume dining leaves little room for paper tickets, repeated questions or a menu that no longer matches the kitchen. DinePixel puts the menu, the order and the status in one connected flow.',
      'For premium dining, the menu can carry richer dish detail. For quick-service, the path from scan to order stays short. The same dashboard supports both.',
    ],
    highlights: [
      'High-volume order flow',
      'Table-aware QR ordering',
      'Live order board',
      'Menu and availability control',
      'Multi-outlet management',
      'Order history and insights',
    ],
    features: [
      {
        icon: 'qr',
        title: 'Table QR ordering',
        description:
          'Give every table a QR entry point into the menu and ordering flow, with the table context carried into the order.',
      },
      {
        icon: 'clock',
        title: 'Live order tracking',
        description:
          'Guests see the order status update as the team moves it through preparation and service.',
      },
      {
        icon: 'layers',
        title: 'A live order board',
        description:
          'See new orders, item details and notes in one view so the team can keep up during a busy service.',
      },
      {
        icon: 'grid',
        title: 'Menu control',
        description:
          'Update dishes, prices, categories and availability from the dashboard without reprinting menus.',
      },
      {
        icon: 'globe',
        title: 'Multi-outlet support',
        description:
          'Use DinePixel across restaurant locations with the right account and menu setup for each brand.',
      },
      {
        icon: 'chart',
        title: 'Order insights',
        description:
          'Review order history and menu activity to understand what guests are choosing and how service is performing.',
      },
    ],
    workflowTitle: 'Built for a busy Mumbai service',
    workflow: [
      {
        label: 'Scan',
        description: 'The guest opens the menu from a table QR code or a takeaway link.',
      },
      {
        label: 'Order',
        description: 'They choose dishes, sizes and notes, then send the order to the restaurant.',
      },
      {
        label: 'Track',
        description: 'The guest follows the status while the team updates it in real time.',
      },
      {
        label: 'Review',
        description: 'The restaurant uses order history and menu activity to refine service.',
      },
    ],
    faqTitle: 'Mumbai restaurant questions',
    faqs: [
      {
        question: 'Do you work with restaurants in Mumbai?',
        answer:
          'Yes. DinePixel is built for restaurants across Mumbai and the wider region. It is a web-based QR ordering and menu platform, so it is not tied to a single physical location.',
      },
      {
        question: 'Can DinePixel handle a high-volume service?',
        answer:
          'The platform is designed to keep the order flow clear: a QR menu, a live order board and status updates that both guests and staff can follow. The right setup depends on the restaurant’s volume and menu complexity.',
      },
      {
        question: 'Can I use DinePixel for a premium restaurant?',
        answer:
          'Yes. Premium restaurants can use richer dish pages, photos, optional 3D views and branded menu styling while keeping the ordering flow straightforward.',
      },
      {
        question: 'Can I manage multiple Mumbai locations?',
        answer:
          'DinePixel supports restaurant accounts and menu content. Multi-outlet groups can discuss the right structure for their locations and menus with the team.',
      },
      {
        question: 'Does DinePixel replace my POS or billing system?',
        answer:
          'No. DinePixel focuses on QR menus, ordering and order management. It is designed to sit alongside the restaurant’s existing POS and billing process.',
      },
      {
        question: 'Do guests need to download an app?',
        answer:
          'No. The QR code opens the menu in the phone browser, so guests can browse and order without installing an app.',
      },
    ],
    relatedTitle: 'Nearby and related guides',
    related: [
      {
        href: '/qr-ordering-system-thane',
        label: 'QR ordering in Thane',
        description: 'QR ordering for cafes and restaurants in Thane.',
      },
      {
        href: '/qr-ordering-system-navi-mumbai',
        label: 'QR ordering in Navi Mumbai',
        description: 'QR ordering for Navi Mumbai restaurants and cloud kitchens.',
      },
      {
        href: '/restaurant-qr-menu',
        label: 'Restaurant QR menu',
        description: 'See how dish pages and menu content work for guests.',
      },
      {
        href: '/restaurant-management-software',
        label: 'Restaurant management software',
        description: 'Explore the dashboard and operational controls.',
      },
    ],
    serviceType: 'QR ordering system in Mumbai',
    areaServed: ['Mumbai', 'Maharashtra', 'India'],
  },

  'restaurant-management-software': {
    slug: '/restaurant-management-software',
    navLabel: 'Restaurant Management Software',
    eyebrow: 'RESTAURANT OPERATIONS',
    title: 'One dashboard for the whole service.',
    titleAccent: 'Menu, orders and insights.',
    metaTitle: 'Restaurant Management Software for QR Ordering | DinePixel',
    metaDescription:
      'Restaurant management software for menu, orders, table service and customer insights. DinePixel brings QR ordering, live order tracking and restaurant operations into one dashboard.',
    heroDescription:
      'DinePixel brings the guest menu, live orders and restaurant controls into one place. It is the ordering and menu layer that sits alongside your existing restaurant systems.',
    intro: [
      'Restaurant software often splits the guest menu, the order and the staff view into separate tools. DinePixel connects them: the menu guests scan, the orders they place and the dashboard the team uses are part of the same product.',
      'It is not a full POS replacement. DinePixel focuses on QR ordering, menu management, order tracking and the operational view that helps a restaurant run a smoother service.',
    ],
    highlights: [
      'Live order board',
      'Menu and availability control',
      'Order status updates',
      'Customer order history',
      'Service request handling',
      'Branding and menu styling',
    ],
    features: [
      {
        icon: 'layers',
        title: 'Live order board',
        description:
          'See incoming orders, item details, notes and totals in one view. Staff can move orders through the service flow without switching tools.',
      },
      {
        icon: 'grid',
        title: 'Menu management',
        description:
          'Manage categories, dishes, prices, photos, sizes and availability from the dashboard.',
      },
      {
        icon: 'clock',
        title: 'Order tracking',
        description:
          'Keep the guest and the team aligned on the same order status, from placed to completed.',
      },
      {
        icon: 'utensils',
        title: 'Table and takeaway orders',
        description:
          'Support table QR ordering for dine-in and general menu links for takeaway in the same platform.',
      },
      {
        icon: 'sparkle',
        title: 'Service requests',
        description:
          'Give guests a way to ask for assistance or request water without leaving the table, subject to the restaurant’s configuration.',
      },
      {
        icon: 'chart',
        title: 'Order insights',
        description:
          'Review order history and menu activity to understand demand and refine the menu over time.',
      },
    ],
    workflowTitle: 'How the dashboard supports service',
    workflow: [
      {
        label: 'Publish',
        description: 'Set up the menu, categories and QR entry points for the restaurant.',
      },
      {
        label: 'Receive',
        description: 'Orders arrive in the live dashboard with item details and notes.',
      },
      {
        label: 'Update',
        description: 'Staff move each order through preparation and service.',
      },
      {
        label: 'Review',
        description: 'Use order history and menu activity to improve the next service.',
      },
    ],
    faqTitle: 'Restaurant management questions',
    faqs: [
      {
        question: 'Is DinePixel a POS system?',
        answer:
          'DinePixel is a QR ordering and restaurant management layer. It focuses on menus, orders, order tracking and the guest experience. It is not a full POS or billing replacement.',
      },
      {
        question: 'Do I need new hardware?',
        answer:
          'The guest experience runs in a phone browser. Restaurants use the dashboard in a browser, so no specialised guest hardware is required for the QR menu flow.',
      },
      {
        question: 'Can I manage multiple locations?',
        answer:
          'DinePixel supports restaurant accounts and menu content. Multi-location groups can discuss the right account and menu structure for their business.',
      },
      {
        question: 'Can staff update order status?',
        answer:
          'Yes. The dashboard lets staff move an order through its status, and the guest can see the same update.',
      },
      {
        question: 'Does DinePixel process payments?',
        answer:
          'DinePixel focuses on ordering and order management. Payment collection and reconciliation remain part of the restaurant’s existing payment process.',
      },
      {
        question: 'Can I use DinePixel with my current billing system?',
        answer:
          'Yes. DinePixel is designed to sit alongside the restaurant’s existing billing and payment workflow rather than replace it.',
      },
    ],
    relatedTitle: 'Related platform guides',
    related: [
      {
        href: '/qr-ordering-system',
        label: 'QR ordering system',
        description: 'The full scan-to-order and live tracking flow.',
      },
      {
        href: '/digital-menu-for-restaurants',
        label: 'Digital menu for restaurants',
        description: 'Keep menu content, pricing and availability current.',
      },
      {
        href: '/features',
        label: 'All DinePixel features',
        description: 'A complete view of the ordering and restaurant tools.',
      },
      {
        href: '/about',
        label: 'About DinePixel',
        description: 'The thinking behind the platform.',
      },
    ],
    serviceType: 'Restaurant management software',
    areaServed: india,
  },
};

export const SEO_PAGE_ORDER = [
  '/qr-ordering-system',
  '/restaurant-qr-menu',
  '/digital-menu-for-restaurants',
  '/qr-ordering-system-thane',
  '/qr-ordering-system-navi-mumbai',
  '/qr-ordering-system-mumbai',
  '/restaurant-management-software',
];

export function getSeoPage(slug: string): SeoPageContent {
  const page = SEO_PAGES[slug];
  if (!page) {
    throw new Error(`Unknown SEO page: ${slug}`);
  }
  return page;
}