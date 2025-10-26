import sys, json

data = json.load(sys.stdin)
ws = data['data']['workspace']

print('View Type:', ws['viewType'])
print('User Role:', ws['userRole'])

mgs = ws.get('hierarchical', [])
print('Mission Groups:', len(mgs))

total_depts = 0
for mg in mgs:
    for div in mg['divisions']:
        total_depts += len(div['departments'])

print('Total Departments:', total_depts)

print('\nFirst 3 Mission Groups:')
for mg in mgs[:3]:
    print(f"  - {mg['name']} ({len(mg['divisions'])} divisions)")
