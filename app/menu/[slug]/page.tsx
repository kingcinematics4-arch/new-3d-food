import { fetchPublicMenuData } from '@/lib/publicMenuData.server';
import MenuContent from './MenuContent';

export const runtime = 'nodejs';

interface PageProps {
  params: { slug: string };
  searchParams: { table?: string; addToOrder?: string; orderNumber?: string; existingOrderId?: string };
}

export default async function MenuPage({ params, searchParams }: PageProps) {
  const { slug } = params;

  const data = await fetchPublicMenuData(slug);

  const initialTableNumber = searchParams.table || '';

  return (
    <MenuContent
      slug={slug}
      initialTableNumber={initialTableNumber}
      initialHotel={data.hotel}
      initialItems={data.menuItems}
      initialCategories={data.categories}
      initialError={data.error}
      addToOrderId={searchParams.addToOrder || searchParams.existingOrderId || null}
      addToOrderNumber={searchParams.orderNumber || null}
    />
  );
}
