import sys
p = r'C:\Users\jay subhash vare\OneDrive\Desktop\new 3d food\components\order\OrderTracking.tsx'
with open(p, 'r', encoding='utf-8') as f:
    s = f.read()

# Replace handleUpdateItemQuantity to preserve theme
old = '''  const handleUpdateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItemQtyUpdating(itemId);
    setItemQtyError(null);
    try {
      const res = await fetch('/api/orders/update-item-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, order_item_id: itemId, quantity }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update quantity');
      setOrder(json.order as LiveOrder);
      setError(null);
    } catch (err: any) {
      setItemQtyError(err.message || 'Failed to update quantity');
    } finally {
      setItemQtyUpdating(null);
    }
  }, [orderId]);'''
new = '''  const handleUpdateItemQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItemQtyUpdating(itemId);
    setItemQtyError(null);
    const prevOrder = orderRef.current;
    try {
      const res = await fetch('/api/orders/update-item-quantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, order_item_id: itemId, quantity }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update quantity');
      const updatedOrder = json.order as LiveOrder;
      if (prevOrder) {
        updatedOrder.hotel_theme = updatedOrder.hotel_theme || prevOrder.hotel_theme;
        updatedOrder.hotel_slug = updatedOrder.hotel_slug || prevOrder.hotel_slug;
      }
      setOrder(updatedOrder);
      setError(null);
    } catch (err: any) {
      setItemQtyError(err.message || 'Failed to update quantity');
    } finally {
      setItemQtyUpdating(null);
    }
  }, [orderId]);'''

if old not in s:
    print('not found')
else:
    s2 = s.replace(old, new)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s2)
    print('done')
