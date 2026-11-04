p = r'C:\Users\jay subhash vare\OneDrive\Desktop\new 3d food\components\order\OrderTracking.tsx'
with open(p) as f:
    s = f.read()
# insert after progress timeline closing div? Look for 'Items Card'
token = '            {/* Items Card */}'
if token in s:
    insert = '''            {/* Add another dish */}
            {(!isCancelled && !isTerminal(status) && (status === 'pending' || status === 'accepted')) && (
              <div style={{ marginBottom: '1rem' }}>
                <Link href={/menu/?addToOrder=} className=\"d3-btn-primary\" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                  + ADD ANOTHER DISH
                </Link>
              </div>
            )}
            {(!isCancelled && (status === 'preparing' || status === 'ready' || status === 'completed' || status === 'delivered')) && (
              <div style={{ marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>Adding dishes is no longer available</div>
            )}

'''
    s2 = s.replace(token, insert + token)
    open(p,'w').write(s2)
    print('done')
else:
    print('no')
