#!/usr/bin/env python3
"""Remove console.log from specific files"""

def remove_console_logs(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    skip_until_closing = False
    brace_count = 0

    for i, line in enumerate(lines):
        # Skip if we're in a multi-line console.log
        if skip_until_closing:
            brace_count += line.count('{') - line.count('}')
            paren_count = line.count('(') - line.count(')')

            # Check if this line closes the console.log
            if (line.strip().endswith('});') or line.strip().endswith(');')) and brace_count <= 0:
                skip_until_closing = False
            continue

        # Check if line has console.log (not console.error/warn)
        if 'console.log' in line and 'console.error' not in line and 'console.warn' not in line:
            # Single line console.log
            if line.strip().endswith(');'):
                continue
            else:
                # Start of multi-line console.log
                skip_until_closing = True
                brace_count = line.count('{') - line.count('}')
                continue

        new_lines.append(line)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    return len(lines) - len(new_lines)

files = [
    'src/app/api/dashboard/route.ts',
    'src/app/api/projects/[projectId]/tasks/route.ts',
    'src/components/layout/department-toolbar.tsx',
    'src/components/modals/create-task-modal.tsx',
]

total = 0
for f in files:
    count = remove_console_logs(f)
    print(f'{f}: removed {count} lines')
    total += count

print(f'\nTotal: {total} lines removed')
