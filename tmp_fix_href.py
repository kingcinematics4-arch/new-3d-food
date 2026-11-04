p = r'C:\Users\jay subhash vare\OneDrive\Desktop\new 3d food\components\order\OrderTracking.tsx'
with open(p) as f:
    s = f.read()
old = 'href={/menu/?addToOrder=}'
new = 'href={/menu/?addToOrder=}'
if old in s:
    s2 = s.replace(old, new)
    open(p,'w').write(s2)
    print('done')
else:
    print('no')
