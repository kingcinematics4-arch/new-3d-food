import type { PublicHotel, PublicMenuItem, PublicCategory, PublicMenuItemSize } from '@/app/menu/[slug]/MenuContent';

export interface CartItem {
  menuItem: PublicMenuItem;
  quantity: number;
  notes?: string;
  size?: PublicMenuItemSize | null;
  sizePrice?: number;
}

export type { PublicMenuItemSize };

export interface MenuTemplateProps {
  hotel: PublicHotel;
  currency: string | null;
  tableNumber: string;
  categories: PublicCategory[];
  pills: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  filteredItems: PublicMenuItem[];
  featuredItems: PublicMenuItem[];
  popularItems: PublicMenuItem[];
  regularItems: PublicMenuItem[];
  cart: CartItem[];
  totalCount: number;
  totalPrice: number;
  onAdd: (item: PublicMenuItem, qty?: number, notes?: string, size?: PublicMenuItemSize | null, sizePrice?: number) => void;
  onRemove: (itemId: string, sizeId: string | null) => void;
  onItemClick: (item: PublicMenuItem) => void;
  onView3D: (item: PublicMenuItem) => void;
  onOpenCart: () => void;
  onOpenWater: () => void;
  onOpenWaiter: () => void;
}
