p = r'C:\Users\jay subhash vare\OneDrive\Desktop\new 3d food\components\order\OrderTracking.tsx'
with open(p) as f:
    s = f.read()
old = '              <div className=\"mt-4 flex flex-col gap-2\">\n'
new = '''              <div className=\"mt-4 flex flex-col gap-2\">
                {!isCancelled && !isTerminal(status) && (status === 'pending' || status === 'accepted') && (
                  <Link href={/menu/?addToOrder=} className=\"d3-btn-primary\" style={{ textAlign: 'center', textDecoration: 'none' }}>
                    ADD ANOTHER DISH
                  </Link>
                )}
                {!isCancelled && (status === 'preparing' || status === 'ready' || status === 'completed' || status === 'delivered') && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', textAlign: 'center' }}>Adding dishes is no longer available</div>
                )}
'''
if old in s:
    s2 = s.replace(old, new)
    open(p,'w').write(s2)
    print('done')
else:
    print('no')
