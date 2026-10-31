'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './authContext';
import { queryClient } from './queryClient';

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
  menu_theme: string;
  custom_theme_config?: import('./customTheme').CustomThemeConfig | null;
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
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
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
  updated_at: string;
  cancelled_at?: string | null;
  order_items?: OrderItem[];
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancellation_source?: 'hotel' | 'customer' | string | null;
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

export interface Category {
  id: string;
  hotel_id: string;
  name: string;
  position: number;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Query keys                                                        */
/* ------------------------------------------------------------------ */

export const queryKeys = {
  hotel: ['hotel'] as const,
  menu: (hotelId: string | null) => ['menu', hotelId] as const,
  orders: (hotelId: string | null) => ['orders', hotelId] as const,
  stats: (hotelId: string | null) => ['stats', hotelId] as const,
  reviews: (hotelId: string | null) => ['reviews', hotelId] as const,
  customization: (hotelId: string | null) => ['customization', hotelId] as const,
  categories: (hotelId: string | null) => ['categories', hotelId] as const,
};

/* ------------------------------------------------------------------ */
/*  SSR guard                                                         */
/* ------------------------------------------------------------------ */

const isServer = typeof window === 'undefined';

function ssrFallback<T>(data: T) {
  return { data, isLoading: false, error: null, refetch: async () => ({}) as any };
}

async function fetchJson(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
  const res = await fetch(input, init);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}

/* ------------------------------------------------------------------ */
/*  useHotel                                                          */
/* ------------------------------------------------------------------ */

export function useHotel() {
  const { user, session } = useAuth();

  if (isServer) {
    return { hotel: null, loading: false, error: null, refetch: async () => {} };
  }

  const query = useQuery({
    queryKey: queryKeys.hotel,
    queryFn: async () => {
      if (!user) return null;
      const json = await fetchJson('/api/hotel/me');
      if (!json.success || !json.hotel) return null;
      return json.hotel as Hotel;
    },
    enabled: !!user,
    staleTime: 300_000,
    gcTime: 600_000,
  });

  const { data: hotel, isLoading: loading, error, refetch } = query;

  return { hotel, loading, error: error?.message || null, refetch };
}

/* ------------------------------------------------------------------ */
/*  useMenuItems                                                      */
/* ------------------------------------------------------------------ */

export function useMenuItems(hotelId: string | null) {
  if (isServer) {
    return { items: [], loading: false, error: null, refetch: async () => {} };
  }

  const query = useQuery({
    queryKey: queryKeys.menu(hotelId),
    queryFn: async () => {
      const url = hotelId ? `/api/menu?hotel_id=${hotelId}` : '/api/menu';
      const json = await fetchJson(url);
      return (json.menuItems || []) as MenuItem[];
    },
    enabled: !!hotelId,
    staleTime: 300_000,
    gcTime: 600_000,
  });

  const { data: items = [], isLoading: loading, error, refetch } = query;

  return { items, loading, error: error?.message || null, refetch: refetch };
}

/* ------------------------------------------------------------------ */
/*  useOrders                                                         */
/* ------------------------------------------------------------------ */

export function useOrders(hotelId: string | null) {
  const queryClient = useQueryClient();

  if (isServer) {
    return {
      orders: [],
      loading: false,
      error: null,
      refetch: async () => {},
      updateOrderStatus: async () => {},
      updatePaymentStatus: async () => {},
      updatingOrderIds: new Set<string>(),
    };
  }

  const query = useQuery({
    queryKey: queryKeys.orders(hotelId),
    queryFn: async () => {
      if (!hotelId) return [] as Order[];
      const json = await fetchJson(`/api/orders?hotel_id=${hotelId}`);
      return (json.orders || []) as Order[];
    },
    enabled: !!hotelId,
    staleTime: 15_000,
    gcTime: 600_000,
    refetchInterval: 3000,
  });

  const { data: orders = [], isLoading: loading, error, refetch } = query;

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const json = await fetchJson('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: status.toLowerCase() }),
      });
      if (!json.success) throw new Error(json.error || 'Failed to update order status');
      return json.order as Order;
    },
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders(hotelId) });
      const previous = queryClient.getQueryData<Order[]>(queryKeys.orders(hotelId));
      queryClient.setQueryData<Order[]>(queryKeys.orders(hotelId), (old: Order[] | undefined) =>
        old ? old.map((o) => (o.id === orderId ? { ...o, status } : o)) : old
      );
      return { previous };
    },
    onError: (err, { orderId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.orders(hotelId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(hotelId) });
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: 'paid' | 'unpaid' }) => {
      const json = await fetchJson('/api/orders/update-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, payment_status: paymentStatus }),
      });
      if (!json.success) throw new Error(json.error || 'Failed to update payment status');
      return json.order as Order;
    },
    onMutate: async ({ orderId, paymentStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders(hotelId) });
      const previous = queryClient.getQueryData<Order[]>(queryKeys.orders(hotelId));
      queryClient.setQueryData<Order[]>(queryKeys.orders(hotelId), (old: Order[] | undefined) =>
        old ? old.map((o) => (o.id === orderId ? { ...o, payment_status: paymentStatus } : o)) : old
      );
      return { previous };
    },
    onError: (err, { orderId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.orders(hotelId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(hotelId) });
    },
  });

  const updatingOrderIds = useRef<Set<string>>(new Set());

  const handleUpdateStatus = useCallback(
    async (id: string, status: string) => {
      if (updatingOrderIds.current.has(id)) return;
      updatingOrderIds.current.add(id);
      try {
        await updateOrderStatusMutation.mutateAsync({ orderId: id, status });
      } finally {
        updatingOrderIds.current.delete(id);
      }
    },
    [updateOrderStatusMutation]
  );

  const handleUpdatePaymentStatus = useCallback(
    async (id: string, paymentStatus: 'paid' | 'unpaid') => {
      if (updatingOrderIds.current.has(id)) return;
      updatingOrderIds.current.add(id);
      try {
        await updatePaymentStatusMutation.mutateAsync({ orderId: id, paymentStatus });
      } finally {
        updatingOrderIds.current.delete(id);
      }
    },
    [updatePaymentStatusMutation]
  );

  return {
    orders,
    loading,
    error: error?.message || null,
    refetch,
    updateOrderStatus: handleUpdateStatus,
    updatePaymentStatus: handleUpdatePaymentStatus,
    updatingOrderIds: updatingOrderIds.current,
  };
}

/* ------------------------------------------------------------------ */
/*  useDashboardStats                                                 */
/* ------------------------------------------------------------------ */

export function useDashboardStats(hotelId: string | null) {
  if (isServer) {
    return {
      stats: { ordersToday: 0, revenueToday: 0, menuItemsCount: 0, qrScansToday: 0 },
      loading: false,
      error: null,
      refetch: async () => {},
    };
  }

  const query = useQuery({
    queryKey: queryKeys.stats(hotelId),
    queryFn: async () => {
      if (!hotelId) {
        return { ordersToday: 0, revenueToday: 0, menuItemsCount: 0, qrScansToday: 0 } as DashboardStats;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [ordersJson, itemsJson] = await Promise.all([
        fetchJson(`/api/orders?hotel_id=${hotelId}&since=${todayISO}`),
        fetchJson(`/api/menu?hotel_id=${hotelId}`),
      ]);

      const orders = (ordersJson.orders || []) as Order[];
      const items = (itemsJson.menuItems || []) as MenuItem[];

      const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      return {
        ordersToday: orders.length,
        revenueToday: revenue,
        menuItemsCount: items.length,
        qrScansToday: 0,
      } as DashboardStats;
    },
    enabled: !!hotelId,
    staleTime: 60_000,
    gcTime: 600_000,
  });

  const { data: stats, isLoading: loading, error, refetch } = query;

  return {
    stats: stats || { ordersToday: 0, revenueToday: 0, menuItemsCount: 0, qrScansToday: 0 },
    loading,
    error: error?.message || null,
    refetch,
  };
}

/* ------------------------------------------------------------------ */
/*  useReviews                                                        */
/* ------------------------------------------------------------------ */

export function useReviews(hotelId: string | null) {
  if (isServer) {
    return { reviews: [], loading: false, error: null, refetch: async () => {} };
  }

  const query = useQuery({
    queryKey: queryKeys.reviews(hotelId),
    queryFn: async () => {
      if (!hotelId) return [] as Review[];
      const json = await fetchJson(`/api/reviews?hotel_id=${hotelId}`);
      return (json.reviews || []) as Review[];
    },
    enabled: !!hotelId,
    staleTime: 300_000,
    gcTime: 600_000,
  });

  const { data: reviews = [], isLoading: loading, error, refetch } = query;

  return { reviews, loading, error: error?.message || null, refetch };
}

/* ------------------------------------------------------------------ */
/*  useHotelCustomization                                             */
/* ------------------------------------------------------------------ */

export function useHotelCustomization(hotelId: string | null) {
  const queryClient = useQueryClient();

  if (isServer) {
    const emptyCustomization = {
      logo_url: '',
      primary_color: '#f59e0b',
      secondary_color: '#10b981',
      menu_style: 'cards',
      card_style: 'glassmorphic',
      dark_mode: true,
      typography: 'Inter',
      welcome_banner: 'Experience our menu in 3D!',
      menu_theme: 'classic-luxury',
    };
    return {
      customization: emptyCustomization,
      loading: false,
      error: null,
      refetch: async () => {},
      saveCustomization: async () => {},
      setCustomization: () => {},
    };
  }

  const query = useQuery({
    queryKey: queryKeys.customization(hotelId),
    queryFn: async () => {
      if (!hotelId) return null;
      const json = await fetchJson(`/api/hotel/${hotelId}`);
      if (!json.success || !json.hotel) return null;
      const h = json.hotel;
      return {
        logo_url: h.logo_url || '',
        primary_color: h.primary_color || '#f59e0b',
        secondary_color: h.secondary_color || '#10b981',
        menu_style: h.menu_style || 'cards',
        card_style: h.card_style || 'glassmorphic',
        dark_mode: h.dark_mode !== false,
        typography: h.typography || 'Inter',
        welcome_banner: h.welcome_text || 'Experience our menu in 3D!',
        menu_theme: h.menu_theme || 'classic-luxury',
      };
    },
    enabled: !!hotelId,
    staleTime: 300_000,
    gcTime: 600_000,
  });

  const { data: customization, isLoading: loading, error, refetch } = query;

  const saveCustomizationMutation = useMutation({
    mutationFn: async (data: {
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      menu_style: string;
      card_style: string;
      dark_mode: boolean;
      typography: string;
      welcome_banner: string;
      menu_theme: string;
    }) => {
      if (!hotelId) throw new Error('No hotel ID');
      const json = await fetchJson('/api/hotel/update', {
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
          menu_theme: data.menu_theme,
        }),
      });
      if (!json.success) throw new Error(json.error || 'Failed to save customization');
      return data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customization(hotelId) });
      const previous = queryClient.getQueryData(queryKeys.customization(hotelId));
      queryClient.setQueryData(queryKeys.customization(hotelId), data);
      return { previous };
    },
    onError: (err, data, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.customization(hotelId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customization(hotelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel });
    },
  });

  const handleSaveCustomization = useCallback(
    async (data: {
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      menu_style: string;
      card_style: string;
      dark_mode: boolean;
      typography: string;
      welcome_banner: string;
      menu_theme: string;
    }) => {
      await saveCustomizationMutation.mutateAsync(data);
    },
    [saveCustomizationMutation]
  );

  return {
    customization: customization || {
      logo_url: '',
      primary_color: '#f59e0b',
      secondary_color: '#10b981',
      menu_style: 'cards',
      card_style: 'glassmorphic',
      dark_mode: true,
      typography: 'Inter',
      welcome_banner: 'Experience our menu in 3D!',
      menu_theme: 'classic-luxury',
    },
    loading,
    saveCustomization: handleSaveCustomization,
    setCustomization: (data: {
      logo_url: string;
      primary_color: string;
      secondary_color: string;
      menu_style: string;
      card_style: string;
      dark_mode: boolean;
      typography: string;
      welcome_banner: string;
      menu_theme: string;
    }) => {
      queryClient.setQueryData(queryKeys.customization(hotelId), data);
    },
    refetch,
  };
}

/* ------------------------------------------------------------------ */
/*  useCategories                                                     */
/* ------------------------------------------------------------------ */

export function useCategories(hotelId: string | null) {
  const queryClient = useQueryClient();

  if (isServer) {
    return {
      categories: [],
      loading: false,
      error: null,
      refetch: async () => {},
      createCategory: async () => null,
    };
  }

  const query = useQuery({
    queryKey: queryKeys.categories(hotelId),
    queryFn: async () => {
      if (!hotelId) return [] as Category[];
      const json = await fetchJson(`/api/categories?hotel_id=${hotelId}`);
      return (json.categories || []) as Category[];
    },
    enabled: !!hotelId,
    staleTime: 300_000,
    gcTime: 600_000,
  });

  const { data: categories = [], isLoading: loading, error, refetch } = query;

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const json = await fetchJson('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!json.success) throw new Error(json.error || 'Failed to create category');
      return json.category as Category;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories(hotelId) });
    },
  });

  const handleCreateCategory = useCallback(
    async (name: string) => {
      return await createCategoryMutation.mutateAsync(name);
    },
    [createCategoryMutation]
  );

  return {
    categories,
    loading,
    error: error?.message || null,
    refetch,
    createCategory: handleCreateCategory,
  };
}

/* ------------------------------------------------------------------ */
/*  Cache clearing                                                    */
/* ------------------------------------------------------------------ */

export function clearDashboardCache() {
  queryClient.clear();
}
