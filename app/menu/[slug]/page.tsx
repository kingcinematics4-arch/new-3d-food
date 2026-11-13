import { fetchPublicMenuData } from '@/lib/publicMenuData.server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getOrdersSchema } from '@/lib/ordersSchema';
import { orderReference } from '@/lib/orderReference';
import MenuContent from './MenuContent';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

interface PageProps {
  params: { slug: string };
  searchParams: { table?: string; addToOrder?: string; orderNumber?: string; existingOrderId?: string };
}

interface ActiveOrderRow {
  id: string;
  hotel_id: string;
  table_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  order_number?: string | null;
  updated_at?: string | null;
}

async function findActiveOrder(hotelId: string, tableNumber: string) {
  const schema = await getOrdersSchema();
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select([
      'id',
      'hotel_id',
      'table_number',
      'status',
      'payment_status',
      'payment_method',
      'total_amount',
      'created_at',
      ...(schema.orderNumber ? ['order_number'] : []),
      ...(schema.updatedAt ? ['updated_at'] : []),
    ].join(', '))
    .eq('hotel_id', hotelId)
    .eq('table_number', tableNumber)
    .neq('payment_status', 'paid')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<ActiveOrderRow>();

  if (error) throw error;
  if (!order) return null;

  return {
    id: order.id,
    order_number: orderReference({ id: order.id, order_number: (order as any).order_number || null }),
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    table_number: order.table_number,
    total_amount: order.total_amount,
    created_at: order.created_at,
    ...(schema.updatedAt ? { updated_at: (order as any).updated_at } : {}),
  };
}

export default async function MenuPage({ params, searchParams }: PageProps) {
  const { slug } = params;

  const data = await fetchPublicMenuData(slug);

  const initialTableNumber = searchParams.table || '';
  const addToOrderId = searchParams.addToOrder || searchParams.existingOrderId || null;

  // If a table number is provided via QR code, check for an active unpaid order
  // before rendering the menu. If one exists, redirect to the order tracking page.
  // Exception: when the customer explicitly opened the menu to add dishes to an
  // existing order, redirecting back would make "Add Another Dish" impossible.
  if (initialTableNumber && data.hotel && !addToOrderId) {
    try {
      const activeOrder = await findActiveOrder(data.hotel.id, initialTableNumber);
      if (activeOrder) {
        redirect(`/order/${encodeURIComponent(activeOrder.id)}?slug=${encodeURIComponent(slug)}`);
      }
    } catch {
      // On any error, fall through to normal menu rendering
      console.error('[menu/[slug]] Active order check failed, showing menu');
    }
  }

  return (
    <MenuContent
      slug={slug}
      initialTableNumber={initialTableNumber}
      initialHotel={data.hotel}
      initialItems={data.menuItems}
      initialCategories={data.categories}
      initialError={data.error}
      addToOrderId={addToOrderId}
      addToOrderNumber={searchParams.orderNumber || null}
    />
  );
}
