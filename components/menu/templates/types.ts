import type { PublicHotel, PublicMenuItem, PublicCategory } from '@/app/menu/[slug]/MenuContent';

export interface CartItem {
  menuItem: PublicMenuItem;
  quantity: number;
  notes?: string;
}

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
  onAdd: (item: PublicMenuItem, qty?: number) => void;
  onRemove: (itemId: string) => void;
  onItemClick: (item: PublicMenuItem) => void;
  onView3D: (item: PublicMenuItem) => void;
  onOpenCart: () => void;
}
