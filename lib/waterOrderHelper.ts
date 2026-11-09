// lib/waterOrderHelper.ts
// Centralized water-order identification, extraction, and sanitization.
// Guarantees consistent water item representation across create, fetch,
// update-status, and admin/customer dashboards.

export const WATER_NAME_PATTERN =
  /\b(free\s+water|mineral\s+water|cold\s+water|normal\s+water|drinking\s+water|water\s+glass|glass\s+of\s+water)\b/i;

const WATER_TAG_REGEX = /\[water_item:(\{.*?\})\]/;
const LEGACY_NORMAL_REGEX = /normal\s+water\s+request(?:\s*:\s*(\d+)?\s*(?:glass(?:es)?)?)?/i;
const LEGACY_ORDER_REGEX = /water\s+order\s*:\s*(.*)/i;
const LEGACY_SERVICE_REGEX = /(\d+)?\s*glass(?:es)?\s+of\s+normal\s+water\s+requested/i;

export interface ExtractedWaterInfo {
  name: string;
  kind: 'water';
  quantity?: number;
}

/**
 * Extracts structured water product name and kind from an item's or order's
 * notes string (handles modern [water_item:{...}] tags and legacy text formats).
 */
export function parseWaterFromNotes(notes: string | null | undefined): ExtractedWaterInfo | null {
  if (!notes || typeof notes !== 'string') return null;
  const str = notes.trim();
  if (!str) return null;

  // 1. Modern tagged format: [water_item:{"name":"Mineral Water (500ml)","kind":"water"}]
  const tagMatch = str.match(WATER_TAG_REGEX);
  if (tagMatch && tagMatch[1]) {
    try {
      const parsed = JSON.parse(tagMatch[1]);
      if (parsed?.name) {
        return {
          name: String(parsed.name).trim(),
          kind: 'water',
          quantity: typeof parsed.quantity === 'number' ? parsed.quantity : undefined,
        };
      }
    } catch {}
  }

  // 2. Legacy "Normal water request: 7 glass(es)"
  const normalMatch = str.match(LEGACY_NORMAL_REGEX);
  if (normalMatch) {
    const qty = normalMatch[1] ? parseInt(normalMatch[1], 10) : undefined;
    return {
      name: 'Free Water',
      kind: 'water',
      quantity: qty && !isNaN(qty) ? qty : undefined,
    };
  }

  // 3. Legacy "Water order: Mineral Water (500ml)"
  const orderMatch = str.match(LEGACY_ORDER_REGEX);
  if (orderMatch && orderMatch[1]) {
    const rawName = orderMatch[1].trim();
    return {
      name: rawName || 'Mineral Water',
      kind: 'water',
    };
  }

  // 4. Legacy service request message "1 glass(es) of normal water requested"
  const srvMatch = str.match(LEGACY_SERVICE_REGEX);
  if (srvMatch) {
    const qty = srvMatch[1] ? parseInt(srvMatch[1], 10) : 1;
    return {
      name: 'Free Water',
      kind: 'water',
      quantity: !isNaN(qty) ? qty : 1,
    };
  }

  return null;
}

/**
 * Strips water-internal tags and legacy water note prefixes so that customer
 * or admin notes do not display water product details.
 */
export function cleanWaterNotes(notes: string | null | undefined): string | null {
  if (!notes || typeof notes !== 'string') return null;
  let cleaned = notes
    .replace(WATER_TAG_REGEX, '')
    .replace(LEGACY_NORMAL_REGEX, '')
    .replace(LEGACY_ORDER_REGEX, '')
    .replace(LEGACY_SERVICE_REGEX, '')
    .trim();
  // Strip trailing/leading punctuation left behind
  cleaned = cleaned.replace(/^[\s,;:-]+|[\s,;:-]+$/g, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Checks whether an item is definitively a water item.
 * NEVER returns true for regular food items like Vada Pav, Burger, Gulab Jamun.
 */
export function isWaterItem(item: any): boolean {
  if (!item) return false;
  const kind = item?.item_kind ?? null;
  if (kind === 'water') return true;
  if (kind && kind !== 'water') return false;

  const rawName = (item?.item_name || item?.name || item?.menu_items?.name || item?.menu_item?.name || '').trim();
  if (rawName && WATER_NAME_PATTERN.test(rawName)) return true;

  const fromNotes = parseWaterFromNotes(item?.notes);
  if (fromNotes?.kind === 'water') return true;

  return false;
}

/**
 * Checks whether an entire order consists strictly of water requests.
 */
export function isWaterOrder(order: { order_items?: any[]; items?: any[]; notes?: string | null } | null | undefined): boolean {
  if (!order) return false;
  const items = order.order_items || order.items || [];
  if (items.length > 0) {
    return items.every((it: any) => isWaterItem(it));
  }
  // Historical order with 0 items but water in notes:
  return !!parseWaterFromNotes(order.notes);
}

/**
 * Normalizes an order_item so it has all required water fields:
 * product name, item_kind = 'water', price, quantity, clean notes.
 */
export function resolveItemProperties(item: any, parentOrderNotes?: string | null) {
  const fromItemNotes = parseWaterFromNotes(item?.notes);
  const fromOrderNotes = parseWaterFromNotes(parentOrderNotes);

  const rawName = (item?.item_name || item?.name || item?.menu_items?.name || item?.menu_item?.name || '').trim();
  const rawKind = item?.item_kind ?? null;

  let finalName = rawName;
  let finalKind = rawKind;

  if (rawKind === 'water' && !finalName) {
    finalName = fromItemNotes?.name || fromOrderNotes?.name || 'Free Water';
  } else if (!finalName) {
    if (fromItemNotes?.name) {
      finalName = fromItemNotes.name;
      finalKind = 'water';
    } else if (fromOrderNotes?.name) {
      finalName = fromOrderNotes.name;
      finalKind = 'water';
    }
  }

  if (finalName && WATER_NAME_PATTERN.test(finalName)) {
    finalKind = 'water';
  }

  const isWater = finalKind === 'water';
  const cleanItemNotes = isWater ? cleanWaterNotes(item?.notes) : (item?.notes || null);

  const priceAtTime = Number(item?.price_at_time ?? item?.price ?? item?.menu_items?.price ?? 0);
  const qty = Number(item?.quantity) || fromItemNotes?.quantity || fromOrderNotes?.quantity || 1;

  return {
    name: finalName || (isWater ? 'Free Water' : null),
    item_kind: isWater ? 'water' : finalKind,
    price: priceAtTime,
    price_at_time: priceAtTime,
    quantity: qty,
    notes: cleanItemNotes,
    is_water: isWater,
  };
}
