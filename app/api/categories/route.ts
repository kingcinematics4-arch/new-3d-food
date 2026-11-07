// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireOwnedHotelId } from '@/lib/hotelAccess';
import { DEFAULT_FOOD_CATEGORIES, categoryKey, normalizeCategoryName } from '@/lib/defaultCategories';

type CategoryRow = {
  id: string;
  hotel_id: string;
  name: string;
  position: number | null;
  created_at: string;
};

function sortCategories(rows: CategoryRow[]): CategoryRow[] {
  return [...rows].sort((a, b) => {
    const pa = typeof a.position === 'number' ? a.position : 0;
    const pb = typeof b.position === 'number' ? b.position : 0;
    if (pa !== pb) return pa - pb;
    return (a.name || '').localeCompare(b.name || '');
  });
}

async function ensureDefaultCategories(hotelId: string, existing: CategoryRow[]): Promise<CategoryRow[]> {
  const byKey = new Map(existing.map((c) => [categoryKey(c.name), c]));
  const missing = DEFAULT_FOOD_CATEGORIES.filter((name) => !byKey.has(categoryKey(name)));
  if (missing.length === 0) return sortCategories(existing);

  // Position defaults after existing custom/seeded rows to avoid overwriting layout.
  const maxPos = existing.reduce((m, c) => Math.max(m, typeof c.position === 'number' ? c.position : 0), -1);
  const toInsert = missing.map((name, i) => ({
    hotel_id: hotelId,
    name,
    position: maxPos + 1 + i,
  }));

  const { data: inserted, error } = await supabaseAdmin
    .from('categories')
    .insert(toInsert)
    .select('*');

  // If insert races or partially fails, re-read to return the authoritative set.
  if (error || !inserted) {
    const { data: refreshed } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('hotel_id', hotelId);
    return sortCategories((refreshed || existing) as CategoryRow[]);
  }

  return sortCategories([...(existing || []), ...(inserted as CategoryRow[])]);
}

async function resolveHotelId(request: Request, requestedHotelId: string | null): Promise<
  { ok: true; hotelId: string } | { ok: false; status: number; error: string }
> {
  if (requestedHotelId) {
    const access = await requireOwnedHotelId(requestedHotelId);
    if (!access.ok) return { ok: false, status: access.status, error: access.error };
    return { ok: true, hotelId: access.hotelId };
  }
  const access = await requireOwnedHotelId(null);
  if (!access.ok) return { ok: false, status: access.status, error: access.error };
  return { ok: true, hotelId: access.hotelId };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedHotelId = searchParams.get('hotel_id');
    const resolved = await resolveHotelId(request, requestedHotelId);
    if (!resolved.ok) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: resolved.status });
    }

    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('hotel_id', resolved.hotelId);

    if (error) throw error;

    const ensured = await ensureDefaultCategories(resolved.hotelId, (categories || []) as CategoryRow[]);
    return NextResponse.json({ success: true, categories: ensured });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hotel_id: requestedHotelId, name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const resolved = await resolveHotelId(request, requestedHotelId ?? null);
    if (!resolved.ok) {
      return NextResponse.json({ success: false, error: resolved.error }, { status: resolved.status });
    }

    const normalized = normalizeCategoryName(name);
    const key = categoryKey(normalized);

    // Case-insensitive duplicate check within the same restaurant.
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('hotel_id', resolved.hotelId);
    if (existingError) throw existingError;
    const duplicate = (existingRows || []).find((c: any) => categoryKey(c.name) === key);
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists.', category: duplicate },
        { status: 409 }
      );
    }

    const maxPos = (existingRows || []).reduce(
      (m: number, c: any) => Math.max(m, typeof c.position === 'number' ? c.position : 0),
      -1
    );

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ hotel_id: resolved.hotelId, name: normalized, position: maxPos + 1 })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 400 }
    );
  }
}

