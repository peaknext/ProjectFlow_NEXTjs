#!/usr/bin/env python3
"""
Safely remove console.log statements from TypeScript/TSX files
"""

import re

files_to_clean = [
    "src/app/(auth)/login/page.tsx",
    "src/app/(dashboard)/department/tasks/page.tsx",
    "src/app/(dashboard)/projects/[projectId]/list/page.tsx",
    "src/app/api/dashboard/route.ts",
    "src/app/api/projects/[projectId]/tasks/route.ts",
    "src/components/common/create-task-button.tsx",
    "src/components/layout/department-toolbar.tsx",
    "src/components/modals/create-task-modal.tsx",
    "src/lib/calculate-progress.ts",
    "src/lib/email.ts",
]

def remove_console_logs_from_file(filepath):
    """Remove console.log lines while preserving code structure"""

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"❌ File not found: {filepath}")
        return False

    new_lines = []
    removed_count = 0

    for i, line in enumerate(lines):
        # Check if line contains console.log (but not console.error or console.warn)
        if 'console.log(' in line and 'console.error' not in line and 'console.warn' not in line:
            # Check if it's a complete statement on one line
            stripped = line.strip()
            if stripped.startswith('console.log(') or '    console.log(' in line or '  console.log(' in line:
                # Skip this line
                removed_count += 1
                # Don't print the line content to avoid encoding issues
                continue

        new_lines.append(line)

    if removed_count > 0:
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return removed_count

    return 0

def main():
    print("Removing console.log statements...\n")

    total_removed = 0
    files_modified = 0

    for filepath in files_to_clean:
        print(f"\n{filepath}")
        count = remove_console_logs_from_file(filepath)

        if count:
            print(f"  OK - Removed {count} console.log statement(s)")
            total_removed += count
            files_modified += 1
        else:
            print(f"  SKIP - No console.log found or already clean")

    print(f"\n" + "="*60)
    print(f"Summary:")
    print(f"   Files modified: {files_modified}")
    print(f"   Total console.log removed: {total_removed}")
    print(f"="*60)

if __name__ == '__main__':
    main()
