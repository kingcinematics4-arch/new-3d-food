// lib/demoData.ts
import { PRESET_3D_MODELS } from './menu';

export interface DemoMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  model_url_glb?: string;
  model_url_usdz?: string;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_veg: boolean;
  calories: number;
  preparation_time_mins: number;
  ingredients: string[];
  allergens: string[];
  dietary_tags: string[];
  rating: number;
  order_count: number;
}

export interface DemoOrder {
  id: string;
  order_code: string;
  table_number: string;
  customer_name: string;
  customer_phone?: string;
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  notes?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }[];
}

export interface DemoCustomization {
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  menu_style: 'grid' | 'list' | 'cards';
  card_style: 'glassmorphic' | 'minimal' | 'bordered';
  dark_mode: boolean;
  typography: 'Inter' | 'Outfit' | 'Playfair Display' | 'Roboto';
  welcome_banner: string;
}

// Initial Demo Categories
export const INITIAL_DEMO_CATEGORIES = [
  'Starters & Appetizers',
  'Chef Specials',
  'Main Course',
  'Artisan Pizzas',
  'Decadent Desserts',
  'Craft Beverages',
];

// Initial Demo Dishes
export const INITIAL_DEMO_ITEMS: DemoMenuItem[] = [
  {
    id: 'demo-item-1',
    name: 'Signature Wagyu Gourmet Burger',
    description: 'Prime Wagyu beef patty with double smoked cheddar, caramelized onion jam, truffle aioli on toasted brioche.',
    price: 22.50,
    category: 'Chef Specials',
    model_url_glb: PRESET_3D_MODELS[0].glb,
    is_available: true,
    is_featured: true,
    is_popular: true,
    is_veg: false,
    calories: 780,
    preparation_time_mins: 15,
    ingredients: ['Wagyu Beef', 'Brioche Bun', 'Smoked Cheddar', 'Truffle Aioli', 'Caramelized Onion'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    dietary_tags: ['Chef Special', 'Popular'],
    rating: 4.9,
    order_count: 142,
  },
  {
    id: 'demo-item-2',
    name: 'Wood-Fired Margherita Supreme',
    description: 'San Marzano DOP tomato sauce, buffalo mozzarella di bufala, fresh basil, and extra virgin olive oil.',
    price: 18.00,
    category: 'Artisan Pizzas',
    model_url_glb: PRESET_3D_MODELS[1].glb,
    is_available: true,
    is_featured: true,
    is_popular: true,
    is_veg: true,
    calories: 640,
    preparation_time_mins: 12,
    ingredients: ['San Marzano Tomatoes', 'Buffalo Mozzarella', 'Fresh Basil', 'EVOO'],
    allergens: ['Gluten', 'Dairy'],
    dietary_tags: ['Vegetarian', 'Organic'],
    rating: 4.8,
    order_count: 118,
  },
  {
    id: 'demo-item-3',
    name: 'Fresh Mediterranean Salad Bowl',
    description: 'Crisp organic romaine, heirloom cherry tomatoes, Persian cucumbers, kalamata olives & French feta.',
    price: 13.99,
    category: 'Starters & Appetizers',
    model_url_glb: PRESET_3D_MODELS[2].glb,
    is_available: true,
    is_featured: false,
    is_popular: false,
    is_veg: true,
    calories: 340,
    preparation_time_mins: 8,
    ingredients: ['Romaine', 'Heirloom Tomatoes', 'Cucumber', 'French Feta', 'Olives'],
    allergens: ['Dairy'],
    dietary_tags: ['Vegetarian', 'Gluten-Free'],
    rating: 4.7,
    order_count: 86,
  },
  {
    id: 'demo-item-4',
    name: 'Decadent Dark Chocolate Lava Cake',
    description: 'Warm Belgian dark chocolate cake with a molten center, served with Madagascar vanilla gelato.',
    price: 11.50,
    category: 'Decadent Desserts',
    model_url_glb: PRESET_3D_MODELS[3].glb,
    is_available: true,
    is_featured: true,
    is_popular: true,
    is_veg: true,
    calories: 510,
    preparation_time_mins: 10,
    ingredients: ['Belgian Chocolate', 'Vanilla Gelato', 'Butter', 'Cocoa'],
    allergens: ['Dairy', 'Eggs', 'Gluten'],
    dietary_tags: ['Dessert', 'Popular'],
    rating: 4.95,
    order_count: 74,
  },
];

// Initial Demo Orders
export const INITIAL_DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'demo-ord-1',
    order_code: 'ORD-501',
    table_number: 'Table 5',
    customer_name: 'Alex Morgan',
    status: 'PLACED',
    total_amount: 40.50,
    payment_method: 'Pay at Table',
    payment_status: 'Unpaid',
    created_at: new Date(Date.now() - 4 * 60000).toISOString(),
    notes: 'Extra napkins please',
    items: [
      { id: '1', name: 'Signature Wagyu Gourmet Burger', quantity: 1, price: 22.50, notes: 'Medium rare' },
      { id: '2', name: 'Wood-Fired Margherita Supreme', quantity: 1, price: 18.00 },
    ],
  },
  {
    id: 'demo-ord-2',
    order_code: 'ORD-502',
    table_number: 'Table 2',
    customer_name: 'Sarah Jenkins',
    status: 'PREPARING',
    total_amount: 25.49,
    payment_method: 'Card / POS',
    payment_status: 'Paid',
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    items: [
      { id: '3', name: 'Fresh Mediterranean Salad Bowl', quantity: 1, price: 13.99 },
      { id: '4', name: 'Decadent Dark Chocolate Lava Cake', quantity: 1, price: 11.50 },
    ],
  },
  {
    id: 'demo-ord-3',
    order_code: 'ORD-503',
    table_number: 'Table 8',
    customer_name: 'David Kim',
    status: 'READY',
    total_amount: 45.00,
    payment_method: 'UPI / Digital Wallet',
    payment_status: 'Paid',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    items: [
      { id: '5', name: 'Signature Wagyu Gourmet Burger', quantity: 2, price: 22.50 },
    ],
  },
];

// Initial Customization State
export const INITIAL_DEMO_CUSTOMIZATION: DemoCustomization = {
  logo_url: '',
  primary_color: '#f59e0b',
  secondary_color: '#10b981',
  menu_style: 'cards',
  card_style: 'glassmorphic',
  dark_mode: true,
  typography: 'Inter',
  welcome_banner: 'Experience our gourmet dishes in 360┬░ 3D & Augmented Reality!',
};

/**
 * Local Storage Helper for Demo Mode Persistence
 */
export function getDemoItems(): DemoMenuItem[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_ITEMS;
  const stored = localStorage.getItem('demo_menu_items');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('demo_menu_items', JSON.stringify(INITIAL_DEMO_ITEMS));
  return INITIAL_DEMO_ITEMS;
}

export function saveDemoItems(items: DemoMenuItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_menu_items', JSON.stringify(items));
  }
}

export function getDemoOrders(): DemoOrder[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_ORDERS;
  const stored = localStorage.getItem('demo_orders');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('demo_orders', JSON.stringify(INITIAL_DEMO_ORDERS));
  return INITIAL_DEMO_ORDERS;
}

export function saveDemoOrders(orders: DemoOrder[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_orders', JSON.stringify(orders));
  }
}

export function getDemoCustomization(): DemoCustomization {
  if (typeof window === 'undefined') return INITIAL_DEMO_CUSTOMIZATION;
  const stored = localStorage.getItem('demo_customization');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.setItem('demo_customization', JSON.stringify(INITIAL_DEMO_CUSTOMIZATION));
  return INITIAL_DEMO_CUSTOMIZATION;
}

export function saveDemoCustomization(customization: DemoCustomization) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_customization', JSON.stringify(customization));
  }
}

/**
 * Helper to check if local demo mode is active
 */
export function isDemoModeActive(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}
