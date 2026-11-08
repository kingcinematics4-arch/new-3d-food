// app/api/service-requests/status/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { z } from 'zod';

const updateStatusSchema = z.object({
  request_id: z.string().min(1, 'request_id is required'),
  status: z.enum(['new', 'accepted', 'in_progress', 'completed', 'cancelled']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = updateStatusSchema.parse(body);

    const access = await requireOwnedHotelId(null);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }
    const hotelId = access.hotelId;

    // Fetch existing request to verify hotel ownership
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('service_requests')
      .select('id, hotel_id, status')
      .eq('id', validated.request_id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      );
    }

    if (existing.hotel_id !== hotelId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized for this hotel request' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: validated.status,
      updated_at: now,
    };

    if (validated.status === 'accepted') {
      updatePayload.accepted_at = now;
    } else if (validated.status === 'completed') {
      updatePayload.completed_at = now;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('service_requests')
      .update(updatePayload)
      .eq('id', validated.request_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      request: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update service request status' },
      { status: 400 }
    );
  }
}
