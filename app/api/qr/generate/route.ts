// app/api/qr/generate/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hotel_id, table_number, hotel_slug, fg_color = '#000000', bg_color = '#FFFFFF' } = body;

    if (!hotel_id || !table_number || !hotel_slug) {
      return NextResponse.json(
        { success: false, error: 'hotel_id, table_number, and hotel_slug are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';

    const targetUrl = `${baseUrl}/menu/${hotel_slug}?table=${table_number}`;

    // Generate Data URL for QR Code
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: fg_color,
        light: bg_color,
      },
    });

    // Save record to DB
    const { data, error } = await supabaseAdmin
      .from('qr_codes')
      .insert({
        hotel_id,
        table_number,
        target_url: targetUrl,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      qrDataUrl,
      targetUrl,
      qrRecord: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
