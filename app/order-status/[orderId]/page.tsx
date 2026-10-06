import OrderTracking from '@/components/order/OrderTracking';

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
  return <OrderTracking orderId={params.orderId} />;
}
