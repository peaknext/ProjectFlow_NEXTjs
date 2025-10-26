#!/usr/bin/env python3
"""
Remove console.log statements from TypeScript files
Keeps console.error, console.warn for production debugging
"""

import re
import os
import glob

def remove_console_logs(file_path):
    """Remove console.log statements while keeping console.error and console.warn"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Pattern 1: Single line console.log
    # console.log('message'); or console.log('message', var);
    pattern1 = r'^\s*console\.log\([^)]*\);?\s*$'

    # Pattern 2: Multi-line console.log (with object literals)
    # console.log('message', {
    #   key: value,
    # });
    pattern2 = r'^\s*console\.log\([^;]*\{[^}]*\}\);?\s*$'

    lines = content.split('\n')
    new_lines = []
    skip_next = False
    in_multiline_console = False
    brace_count = 0

    i = 0
    while i < len(lines):
        line = lines[i]

        # Check if line contains console.log (not console.error or console.warn)
        if 'console.log' in line and 'console.error' not in line and 'console.warn' not in line:
            # Single line console.log
            if re.match(pattern1, line, re.MULTILINE):
                # Skip this line
                i += 1
                continue

            # Multi-line console.log start
            if 'console.log(' in line and not line.rstrip().endswith(');'):
                in_multiline_console = True
                brace_count = line.count('{') - line.count('}')
                paren_count = line.count('(') - line.count(')')
                i += 1

                # Skip lines until we find the closing
                while i < len(lines):
                    curr_line = lines[i]
                    brace_count += curr_line.count('{') - curr_line.count('}')
                    paren_count += curr_line.count('(') - curr_line.count(')')

                    if paren_count <= 0 and (curr_line.rstrip().endswith(');') or curr_line.rstrip().endswith(')')):
                        in_multiline_console = False
                        break
                    i += 1

                i += 1
                continue

        new_lines.append(line)
        i += 1

    new_content = '\n'.join(new_lines)

    # If content changed, write back
    if new_content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True

    return False

def main():
    # Find all TypeScript files in src/app/api
    api_files = glob.glob('src/app/api/**/*.ts', recursive=True)

    modified_count = 0

    for file_path in api_files:
        print(f'Processing: {file_path}')
        if remove_console_logs(file_path):
            print(f'  ✓ Removed console.log statements')
            modified_count += 1
        else:
            print(f'  - No changes needed')

    print(f'\nSummary: Modified {modified_count} files')

if __name__ == '__main__':
    main()
