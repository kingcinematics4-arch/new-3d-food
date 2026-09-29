// lib/menu.ts
import { z } from 'zod';

export const menuItemSchema = z.object({
  id: z.string().optional(),
  category_id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  image_url: z.string().optional(),
  model_url_glb: z.string().optional(),
  model_url_usdz: z.string().optional(),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  is_veg: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  rating: z.number().min(0).max(5).default(0),
  order_count: z.number().int().default(0),
  dietary_tags: z.array(z.string()).default([]),
  calories: z.number().optional(),
  preparation_time_mins: z.number().optional(),
  ingredients: z.array(z.string()).default([]),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

export interface MenuItem {
  id: string;
  hotel_id: string;
  category_id?: string;
  category?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  model_url_glb?: string;
  model_url_usdz?: string;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_veg: boolean;
  allergens?: string[];
  rating: number;
  order_count: number;
  dietary_tags?: string[];
  calories?: number;
  preparation_time_mins?: number;
  ingredients?: string[];
  created_at?: string;
}

// Preset 3D Model Templates for demo / quick assignment (Uses local paths & procedural 3D plate fallback)
export const PRESET_3D_MODELS = [
  {
    name: 'Gourmet Burger',
    glb: '/models/burger.glb',
    category: 'Main Course',
    icon: '🍔',
  },
  {
    name: 'Artisan Pizza',
    glb: '/models/pizza.glb',
    category: 'Main Course',
    icon: '🍕',
  },
  {
    name: 'Fresh Salad Bowl',
    glb: '/models/salad.glb',
    category: 'Starters',
    icon: '🥗',
  },
  {
    name: 'Decadent Cake',
    glb: '/models/cake.glb',
    category: 'Dessert',
    icon: '🍰',
  },
];
