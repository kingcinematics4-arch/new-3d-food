p = r'C:\Users\jay subhash vare\OneDrive\Desktop\new 3d food\components\order\OrderTracking.tsx'
with open(p) as f:
    s = f.read()
for token in ['Items</p>', 'd3-eyebrow']:
    i = s.find(token)
    if i >= 0:
        print('FOUND')
        start = max(0,i-500)
        end = min(len(s), i+900)
        print(s[start:end])
        break
