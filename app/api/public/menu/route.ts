import { NextResponse } from 'next/server';
import { fetchPublicMenuData } from '@/lib/publicMenuData.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get('slug') || '').trim().toLowerCase();

    const { hotel, categories, menuItems, error } = await fetchPublicMenuData(slug);

    if (!hotel) {
      return new NextResponse(JSON.stringify({ success: false, error: error || 'No menu was found for this restaurant' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    return new NextResponse(JSON.stringify({
      success: true,
      hotel,
      categories,
      menuItems,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ success: false, error: error.message || 'Failed to load this menu' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
