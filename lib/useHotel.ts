'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './authContext';

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  menu_style: string;
  card_style: string;
  dark_mode: boolean;
  typography: string;
  welcome_text: string;
  custom_domain: string | null;
  currency: string;
  tax_rate: number;
  service_charge: number;
  is_active: boolean;
  subscription_plan: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  hotel_id: string;
  category_id: string | null;
  category?: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  model_url_glb: string | null;
  model_url_usdz: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_veg: boolean;
  allergens: string[];
  rating: number;
  order_count: number;
  dietary_tags: string[];
  calories: number | null;
  preparation_time_mins: number | null;
  ingredients: string[];
  created_at: string;
}

export interface Order {
  id: string;
  hotel_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  table_number: string | null;
  notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  tax: number;
  service_charge: number;
  total_amount: number;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  quantity: number;
  price_at_time: number;
  notes: string | null;
  created_at: string;
  menu_item?: {
    name: string;
  };
}

export interface Review {
  id: string;
  hotel_id: string | null;
  order_item_id: string | null;
  menu_item_name: string | null;
  table_number: string | null;
  rating: number;
  comment: string | null;
  customer_name: string;
  created_at: string;
}

export interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  menuItemsCount: number;
  qrScansToday: number;
}

export function useHotel() {
  const { user, session, loading: authLoading } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHotel = useCallback(async () => {
    if (!user) {
      setHotel(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Resolve the hotel through a server route so the auth->hotel lookup
      // runs with the request's authenticated session (RLS-safe). The browser
      // client cannot query hotels / hotel_users directly.
      const res = await fetch('/api/hotel/me');
      const json = await res.json();
      if (!res.ok || !json.success || !json.hotel) {
        setHotel(null);
        return;
      }
      setHotel(json.hotel as Hotel);
    } catch (err: any) {
      console.error('Error fetching hotel:', err);
      setError(err.message);
      setHotel(null);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    if (!authLoading) {
      fetchHotel();
    }
  }, [authLoading, fetchHotel]);

  return { hotel, loading, error, refetch: fetchHotel };
}

export function useMenuItems(hotelId: string | null) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!hotelId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/menu?hotel_id=${hotelId}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.menuItems || []);
      } else {
        throw new Error(json.error || 'Failed to fetch menu items');
      }
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}

export function useOrders(hotelId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!hotelId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/orders?hotel_id=${hotelId}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders || []);
      } else {
        throw new Error(json.error || 'Failed to fetch orders');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: status.toLowerCase() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update order status');
      await fetchOrders();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  return { orders, loading, error, refetch: fetchOrders, updateOrderStatus };
}

export function useDashboardStats(hotelId: string | null) {
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenueToday: 0,
    menuItemsCount: 0,
    qrScansToday: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!hotelId) {
      setStats({ ordersToday: 0, revenueToday: 0, menuItemsCount: 0, qrScansToday: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [ordersRes, itemsRes] = await Promise.all([
        fetch(`/api/orders?hotel_id=${hotelId}&since=${todayISO}`),
        fetch(`/api/menu?hotel_id=${hotelId}`),
      ]);

      const ordersJson = await ordersRes.json();
      const itemsJson = await itemsRes.json();

      const orders = ordersJson.success ? (ordersJson.orders || []) : [];
      const items = itemsJson.success ? (itemsJson.menuItems || []) : [];

      const revenue = orders.reduce((sum: number, o: Order) => sum + (o.total_amount || 0), 0);

      setStats({
        ordersToday: orders.length,
        revenueToday: revenue,
        menuItemsCount: items.length,
        qrScansToday: 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStats({ ordersToday: 0, revenueToday: 0, menuItemsCount: 0, qrScansToday: 0 });
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

export function useReviews(hotelId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!hotelId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?hotel_id=${hotelId}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews || []);
      } else {
        throw new Error(json.error || 'Failed to fetch reviews');
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, error, refetch: fetchReviews };
}

export function useHotelCustomization(hotelId: string | null) {
  const [customization, setCustomization] = useState({
    logo_url: '',
    primary_color: '#f59e0b',
    secondary_color: '#10b981',
    menu_style: 'cards',
    card_style: 'glassmorphic',
    dark_mode: true,
    typography: 'Inter',
    welcome_banner: 'Experience our menu in 3D!',
  });
  const [loading, setLoading] = useState(true);

  const fetchCustomization = useCallback(async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/hotel/${hotelId}`);
      const json = await res.json();
      if (json.success && json.hotel) {
        const h = json.hotel;
        setCustomization({
          logo_url: h.logo_url || '',
          primary_color: h.primary_color || '#f59e0b',
          secondary_color: h.secondary_color || '#10b981',
          menu_style: h.menu_style || 'cards',
          card_style: h.card_style || 'glassmorphic',
          dark_mode: h.dark_mode !== false,
          typography: h.typography || 'Inter',
          welcome_banner: h.welcome_text || 'Experience our menu in 3D!',
        });
      }
    } catch (err) {
      console.error('Error fetching hotel customization:', err);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchCustomization();
  }, [fetchCustomization]);

  const saveCustomization = async (data: typeof customization) => {
    if (!hotelId) return;
    try {
      const res = await fetch('/api/hotel/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          logo_url: data.logo_url,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          menu_style: data.menu_style,
          card_style: data.card_style,
          dark_mode: data.dark_mode,
          typography: data.typography,
          welcome_text: data.welcome_banner,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save customization');
      setCustomization(data);
    } catch (err) {
      console.error('Error saving customization:', err);
      throw err;
    }
  };

  return { customization, loading, saveCustomization, setCustomization, refetch: fetchCustomization };
}

export interface Category {
  id: string;
  hotel_id: string;
  name: string;
  position: number;
  created_at: string;
}

export function useCategories(hotelId: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!hotelId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/categories?hotel_id=${hotelId}`);
      const json = await res.json();
      if (json.success) {
        setCategories(json.categories || []);
      } else {
        throw new Error(json.error || 'Failed to fetch categories');
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string) => {
    if (!hotelId) return null;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, name }),
      });
      const json = await res.json();
      if (json.success) {
        setCategories((prev) => [...prev, json.category]);
        return json.category;
      }
      throw new Error(json.error || 'Failed to create category');
    } catch (err) {
      console.error('Error creating category:', err);
      return null;
    }
  };

  return { categories, loading, error, refetch: fetchCategories, createCategory };
}