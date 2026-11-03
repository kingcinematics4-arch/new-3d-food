const fs = require('fs');
let s = fs.readFileSync('app/dashboard/orders/page.tsx', 'utf8');
const old =                   <div style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-warm)', paddingTop: '0.75rem', marginTop: 8,
                  }}>
                    <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>TOTAL ORDER AMOUNT</span>
                    <span className="d3-figure" style={{ fontSize: '1.25rem', color: 'var(--gold)' }}>
                      {order.total_amount != null ? formatPrice(Number(order.total_amount) || 0, hotel?.currency) : 'N/A'}
                    </span>
                  </div>;
const neu =                   <div style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column', gap: 4,
                    borderTop: '1px solid var(--border-warm)', paddingTop: '0.75rem', marginTop: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>TOTAL ORDER AMOUNT</span>
                      <span className="d3-figure" style={{ fontSize: '1.25rem', color: 'var(--gold)' }}>
                        {order.total_amount != null ? formatPrice(Number(order.total_amount) || 0, hotel?.currency) : 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10b981' }}>ACTIVE ORDER TOTAL</span>
                      <span className="d3-figure" style={{ fontSize: '1.25rem', color: '#10b981' }}>
                        {formatPrice(((order.order_items || [])).reduce((sum, it) => {
                          const st = ((it.status || 'active') + '').toLowerCase();
                          if (st === 'cancelled') return sum;
                          const p = it.price_at_time != null ? it.price_at_time : (it.price != null ? it.price : (it.menu_item?.price || 0));
                          const q = Number(it.quantity) || 1;
                          return sum + (Number(p) || 0) * q;
                        }, 0), hotel?.currency)}
                      </span>
                    </div>
                  </div>;
if (s.includes(old)) { s = s.split(old).join(neu); fs.writeFileSync('app/dashboard/orders/page.tsx', s); console.log('ok'); } else { console.log('no'); }
