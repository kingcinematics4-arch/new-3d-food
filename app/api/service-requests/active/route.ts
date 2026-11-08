// app/api/service-requests/active/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotel_id');
    const tableNumber = searchParams.get('table_number');

    if (!hotelId || !tableNumber) {
      return NextResponse.json(
        { success: false, error: 'hotel_id and table_number are required' },
        { status: 400 }
      );
    }

    const { data: requests, error } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('table_number', tableNumber.trim())
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      requests: requests || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch active requests' },
      { status: 500 }
    );
  }
}
