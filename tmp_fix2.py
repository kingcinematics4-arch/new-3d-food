import re
p = r'C:\Users\jay subhash vare\OneDrive\Desktop\new 3d food\app\api\orders\update-item-quantity\route.ts'
with open(p,'r',encoding='utf-8') as f:
    s = f.read()
bad1 = ".select(id, status, payment_status, payment_method, table_number, customer_name, customer_phone, notes, total_amount, created_at, updated_at, order_number, order_items())"
good = ".select(\id, status, payment_status, payment_method, table_number, customer_name, customer_phone, notes, total_amount, created_at, updated_at, order_number, order_items(\)\)"
s2 = s.replace(bad1, good)
if s2 == s:
    s2 = re.sub(r\"\.select\([^\)]*order_items\(\)[^\)]*\)\", good, s)
with open(p,'w',encoding='utf-8') as f:
    f.write(s2)
print('done')
