// app/api/service-requests/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
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
