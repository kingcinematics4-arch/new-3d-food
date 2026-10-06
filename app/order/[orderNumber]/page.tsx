import OrderTracking from '@/components/order/OrderTracking';

export default function OrderPage({ params }: { params: { orderNumber: string } }) {
  return <OrderTracking orderId={params.orderNumber} />;
}
