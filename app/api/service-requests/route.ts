// app/api/service-requests/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { getOrderItemsSchema } from '@/lib/ordersSchema';
import { z } from 'zod';

const REQUEST_TYPES = [
  'call_waiter',
  'drinking_water',
  'cutlery',
  'tissue',
  'assistance',
  'bill',
] as const;

const createServiceRequestSchema = z.object({
  hotel_id: z.string().min(1, 'hotel_id is required'),
  table_number: z.string().min(1, 'table_number is required'),
  request_type: z.enum(REQUEST_TYPES),
  message: z.string().max(500).optional(),
});

// GET: Hotel dashboard fetches service requests for its hotel
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelIdParam = searchParams.get('hotel_id');

    const access = await requireOwnedHotelId(hotelIdParam);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }
    const hotelId = access.hotelId;

    const { data: requests, error } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      requests: requests || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch service requests' },
      { status: 500 }
    );
  }
}

// POST: Customer creates a new service request from QR menu
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createServiceRequestSchema.parse(body);

    const tableTrimmed = validated.table_number.trim();

    // Prevent duplicate requests: check if there's already an active (new or in_progress or accepted) request
    // of the same type for this table created in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recentDuplicate } = await supabaseAdmin
      .from('service_requests')
      .select('id, status, created_at')
      .eq('hotel_id', validated.hotel_id)
      .eq('table_number', tableTrimmed)
      .eq('request_type', validated.request_type)
      .in('status', ['new', 'accepted', 'in_progress'])
      .gte('created_at', twoMinutesAgo)
      .maybeSingle();

    if (recentDuplicate) {
      return NextResponse.json(
        {
          success: true,
          duplicate: true,
          message: 'A similar request was already sent just now. The waiter has been notified!',
          request: recentDuplicate,
        },
        { status: 200 }
      );
    }

    const { data: created, error } = await supabaseAdmin
      .from('service_requests')
      .insert({
        hotel_id: validated.hotel_id,
        table_number: tableTrimmed,
        request_type: validated.request_type,
        message: validated.message?.trim() || null,
        status: 'new',
      })
      .select()
      .single();

    if (error) throw error;

    // Integration Layer: when a drinking water service request is submitted,
    // seamlessly create a corresponding water order item in `orders` & `order_items`
    // so it immediately appears on the Admin Order Dashboard under ORDER ITEMS
    if (validated.request_type === 'drinking_water') {
      try {
        const itemSchema = await getOrderItemsSchema().catch(() => ({ itemName: false, itemKind: false } as any));
        const qtyMatch = (validated.message || '').match(/(\d+)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const validQty = !isNaN(qty) && qty > 0 ? qty : 1;
        const tag = `[water_item:{"name":"Free Water","kind":"water"}]`;

        const { data: newOrder } = await supabaseAdmin
          .from('orders')
          .insert({
            hotel_id: validated.hotel_id,
            table_number: tableTrimmed,
            customer_name: 'Guest',
            order_type: 'dine_in',
            payment_method: 'pay_at_table',
            status: 'pending',
            payment_status: 'unpaid',
            total_amount: 0,
            notes: null,
          })
          .select()
          .single();

        if (newOrder) {
          const itemRow: Record<string, any> = {
            order_id: newOrder.id,
            menu_item_id: null,
            quantity: validQty,
            price_at_time: 0,
            notes: tag,
          };
          if (itemSchema.itemName) itemRow.item_name = 'Free Water';
          if (itemSchema.itemKind) itemRow.item_kind = 'water';
          await supabaseAdmin.from('order_items').insert([itemRow]);
          await supabaseAdmin.from('order_status_history').insert({
            order_id: newOrder.id,
            status: 'pending',
            note: 'Free water requested via service request',
          });

          // Link this water order to an existing open food order for the same
          // table so that delivered water charges are added to that customer's
          // main bill. Dine-in water orders always need a parent food order
          // for combined billing; takeaway water orders may stand alone.
          try {
            const { data: existingFoodOrders } = await supabaseAdmin
              .from('orders')
              .select('id')
              .eq('hotel_id', validated.hotel_id)
              .eq('table_number', tableTrimmed)
              .is('linked_order_id', null)
              .in('status', ['pending', 'accepted', 'preparing', 'ready'])
              .order('created_at', { ascending: false })
              .limit(1);

            if (existingFoodOrders && existingFoodOrders.length > 0) {
              const parentId = existingFoodOrders[0].id;
              await supabaseAdmin
                .from('orders')
                .update({ linked_order_id: parentId })
                .eq('id', newOrder.id);
            }
          } catch (linkErr: any) {
            // linked_order_id column may not exist yet (migration 030 not applied)
            // Water order still functions as a standalone record; billing link
            // will work once migration 030 is applied.
            console.error('[service-requests] failed to link water order to parent:', linkErr?.message);
          }
        }
      } catch (e: any) {
        console.error('[service-requests] failed to create companion water order:', e?.message);
      }
    }

    return NextResponse.json({
      success: true,
      request: created,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create service request' },
      { status: 400 }
    );
  }
}
