import OrderTracking from '@/components/order/OrderTracking';

export default function OrderPage({
  params,
  searchParams,
}: {
  params: { orderNumber: string };
  searchParams: { slug?: string };
}) {
  // The slug the restaurant menu appended to the tracking link, so the
  // "Back to Menu" link returns to the restaurant the order was placed
  // with instead of the site root.
  return <OrderTracking orderId={params.orderNumber} hotelSlug={searchParams.slug} />;
}
