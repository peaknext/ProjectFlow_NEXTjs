# Data Export Scripts

This folder contains scripts for exporting data from Google Apps Script (Google Sheets) to prepare for PostgreSQL migration.

## Files

- **export-script.gs** - Google Apps Script file for exporting all data to JSON (v2.0 - 21 tables)
- **README.md** - This file

## Important Note - Version 2.0

**Version 2.0 Updates:**
This version is updated to match the **ACTUAL schema** from the original GAS project (Code.gs).

**Complete table list (21 tables):**

**Core Tables (9 tables - Required):**
1. Users
2. UserSessions
3. MissionGroups
4. Divisions
5. Departments
6. Projects
7. Tasks
8. Statuses
9. Notifications

**Additional Tables (12 tables - Optional but recommended):**
10. Comments
11. Checklists
12. History
13. Holidays
14. HospMissions
15. ITGoals
16. ActionPlans
17. Requests
18. Config
19. Permissions
20. RolePermissions
21. Phases

---

## How to Use

### Step 1: Prepare Google Apps Script Project

1. Open your Google Sheets with ProjectFlow data
2. Go to **Extensions > Apps Script**
3. You should see your existing `Code.gs` file

### Step 2: Add Export Script

**Option A: Add to existing Code.gs**
1. Open `Code.gs` in the Apps Script editor
2. Open `export-script.gs` from this folder
3. Copy the entire content
4. Paste at the end of your existing `Code.gs` file
5. Save (Ctrl+S or Cmd+S)

**Option B: Create new file (recommended)**
1. In Apps Script editor, click the **+** button next to Files
2. Choose "Script"
3. Name it: `ExportScript`
4. Open `export-script.gs` from this folder
5. Copy the entire content and paste into the new file
6. Save (Ctrl+S or Cmd+S)

### Step 3: Verify Your Sheets

Before exporting, make sure you have all required sheets:

1. In Apps Script editor, select function: `checkAllSheetsExist`
2. Click **Run** (▶ button)
3. If prompted, authorize the script to access your spreadsheet
4. View the results in **Execution log** (View > Logs or Ctrl+Enter)

**Expected output:**
```
Checking if all sheets exist...

Core Sheets (Required):
✅ Users
✅ UserSessions
✅ MissionGroups
✅ Divisions
✅ Departments
✅ Projects
✅ Tasks
✅ Statuses
✅ Notifications

Additional Sheets (Optional but recommended):
✅ Comments
✅ Checklists
✅ History
✅ Holidays
✅ HospMissions
✅ ITGoals
✅ ActionPlans
✅ Requests
✅ Config
✅ Permissions
✅ RolePermissions
✅ Phases

✅ All core sheets exist! Ready to export.
📊 Total: 9 core + 12 additional = 21 tables
```

### Step 4: Test Export (Optional but Recommended)

Test with a small table first:

1. Select function: `testExportUsers`
2. Click **Run**
3. Check the logs to verify the export works correctly

### Step 5: Export All Data

⚠️ **IMPORTANT**: If you have a large dataset (>5,000 records), the log output may be truncated. In that case, **skip to Step 5A** instead.

1. Select function: `exportAllDataForMigration`
2. Click **Run**
3. **Wait** - This may take 2-3 minutes depending on data size
4. When complete, view the logs (View > Logs or Ctrl+Enter)
5. You'll see a summary like this:

```
========================================
ProjectFlow Data Export v2.0 Starting...
========================================

Exporting Core Tables (1-9)...
✅ Users: 50 records
✅ Sessions: 10 records
✅ MissionGroups: 3 records
✅ Divisions: 8 records
✅ Departments: 15 records
✅ Projects: 25 records
✅ Tasks: 150 records
✅ Statuses: 40 records
✅ Notifications: 30 records

Exporting Additional Tables (10-21)...
✅ Comments: 75 records
✅ Checklists: 45 records
✅ History: 200 records
✅ Holidays: 12 records
✅ HospMissions: 5 records
✅ ITGoals: 10 records
✅ ActionPlans: 8 records
✅ Requests: 20 records
✅ Config: 15 records
✅ Permissions: 25 records
✅ RolePermissions: 60 records
✅ Phases: 30 records

========================================
Export Summary:
========================================
Total Records: 836
Total Tables: 21
Duration: 18.45 seconds
Timestamp: 2025-10-20T10:30:00.000Z
========================================
✅ Export completed successfully!

Next steps:
1. Copy the JSON output below
2. Save to file: migration_data.json
3. Verify the file is valid JSON
4. Keep the file secure (contains password hashes)
5. Use import script to migrate to PostgreSQL

========================================
JSON OUTPUT (Copy everything below):
========================================

{
  "exportMetadata": {
    "exportDate": "2025-10-20T10:30:00.000Z",
    ...
  },
  "users": [...],
  "tasks": [...],
  ...
}

========================================
END OF JSON OUTPUT
========================================
```

### Step 5A: Export to Google Drive (Recommended for Large Datasets)

**Use this method if:**
- ✅ Your dataset is large (>5,000 records)
- ✅ Log output is truncated ("Logging output too large")
- ✅ You want to avoid copying/pasting from logs

**Instructions:**

1. Select function: **`exportToGoogleDrive`**
2. Click **Run**
3. **Wait** - This may take 2-3 minutes
4. Check the logs for the file URL:

```
========================================
✅ Export to Google Drive Successful!
========================================
File Name: ProjectFlow_Migration_Data_20251020_143025.json
File ID: 1a2b3c4d5e6f...
File Size: 1,234.56 KB
Duration: 45.32 seconds

File URL:
https://drive.google.com/file/d/1a2b3c4d5e6f.../view

========================================
Next Steps:
1. Click the URL above to open the file
2. Download the JSON file
3. Verify it's valid JSON
4. Keep the file secure (contains sensitive data)
5. Use the import script for migration
========================================
```

5. **Click the URL** to open the file in Google Drive
6. **Download** the file to your computer
7. **Rename** if needed: `migration_data.json`
8. **Skip to Step 7** (Secure the File)

**Alternative Options (if full export is too large):**

- `exportCoreToGoogleDrive()` - Export only 9 core tables
- `exportAdditionalToGoogleDrive()` - Export only 12 additional tables
- Then merge the two files manually

### Step 6: Save the JSON Output

**Only if you used Step 5 (log output method):**

1. **Scroll to find the JSON output** in the logs (between the markers)
2. **Select and copy** the entire JSON object (from `{` to `}`)
3. **Paste into a text editor** (VS Code, Notepad++, etc.)
4. **Save as:** `migration_data.json`
5. **Verify it's valid JSON:**
   - In VS Code, the file should be properly formatted
   - No syntax errors should be highlighted
   - You can also use https://jsonlint.com to validate

### Step 7: Secure the File

⚠️ **IMPORTANT SECURITY NOTE:**

The exported JSON contains:
- Password hashes and salts
- Session tokens
- User emails and personal information
- All business data

**Keep this file secure:**
- ✅ Store in a secure location
- ✅ Do NOT commit to public repositories
- ✅ Delete after successful migration
- ✅ Use encrypted storage if possible
- ❌ Do NOT share via email or messaging apps

Add to `.gitignore`:
```
migration_data.json
```

---

## Exported Data Structure

The JSON file will have this structure:

```json
{
  "exportMetadata": {
    "exportDate": "ISO timestamp",
    "version": "2.0",
    "spreadsheetId": "Google Sheets ID",
    "spreadsheetName": "Spreadsheet name",
    "totalTables": 21,
    "note": "Complete export from original GAS project (all 21 tables)"
  },
  "users": [...],              // Array of user records
  "sessions": [...],           // Array of session records
  "missionGroups": [...],      // Organization structure
  "divisions": [...],
  "departments": [...],
  "projects": [...],           // Project records
  "tasks": [...],              // Task records
  "statuses": [...],           // Custom statuses per project
  "notifications": [...],      // User notifications
  "comments": [...],           // Task comments
  "checklists": [...],         // Task checklists
  "history": [...],            // Task history/activity
  "holidays": [...],           // Holiday calendar
  "hospMissions": [...],       // Hospital strategic missions
  "itGoals": [...],            // IT goals
  "actionPlans": [...],        // Action plans
  "requests": [...],           // User requests
  "config": [...],             // Application configuration
  "permissions": [...],        // Permission definitions
  "rolePermissions": [...],    // Role-permission mappings
  "phases": [...]              // Project phases
}
```

Each record includes:
- `originalRowNumber`: Row number in Google Sheets (for debugging)
- `originalId`: Original ID from Sheets (for maintaining relationships)
- All field values from the sheet

---

## Schema Details

### Core Tables

**1. Users (16 columns)**
- Email, Full Name, Password Hash, Salt
- Role, Profile Image URL, Department ID
- Verification tokens, Reset tokens
- User Status, Job Title, Job Level
- Pinned Tasks (JSON array)
- Additional Roles (JSON object)

**2. UserSessions (3 columns)**
- Session Token, User ID, Expiry Timestamp

**3-5. Organization Structure**
- MissionGroups: ID, Name, Chief User ID
- Divisions: ID, Name, Mission Group ID, Leader User ID
- Departments: ID, Name, Division ID, Head User ID, Tel

**6. Projects (10 columns)**
- ID, Name, Description, Department ID
- Owner User ID, Created Date, Status
- Action Plan ID, Date Deleted, User Deleted

**7. Tasks (17 columns)**
- ID, Name, Project ID, Description
- Assignee User ID, Status ID, Priority
- Start Date, Due Date, Parent Task ID
- Creator User ID, Close Date, Difficulty
- Is Closed, Close Type, User Closed ID

**8. Statuses (6 columns)**
- ID, Name, Color, Order, Type, Project ID

**9. Notifications (8 columns)**
- ID, User ID, Triggered By User ID
- Type, Message, Task ID
- Created At, Is Read

### Additional Tables

**10. Comments (6 columns)**
- ID, Task ID, Commentor User ID
- Comment Text, Created At, Mentions (JSON)

**11. Checklists (6 columns)**
- ID, Name, Is Checked
- Creator User ID, Created Date, Task ID

**12. History (5 columns)**
- ID, History Text, History Date
- Task ID, User ID

**13. Holidays (2 columns)**
- Date (Primary Key), Name

**14. HospMissions (5 columns)**
- ID, Name, Description, Start Year, End Year

**15. ITGoals (3 columns)**
- ID, Name, Hosp Mission ID

**16. ActionPlans (4 columns)**
- ID, Name, Hosp Mission ID, IT Goal IDs (JSON array)

**17. Requests (12 columns)**
- ID, User ID, Request Type, Description, Name
- Created At, Task ID, Purpose, Purpose Details
- Days Demanded, Days Needed, User Tel

**18. Config (3 columns)**
- ID, Config Key, Config Value

**19. Permissions (3 columns)**
- Permission Key (Primary Key), Permission Name, Category

**20. RolePermissions (3 columns)**
- Role Name, Permission Key, Allowed (Boolean)

**21. Phases (6 columns)**
- ID, Name, Phase Order, Project ID, Start Date, End Date

---

## Utility Functions

The script includes several helper functions:

### checkAllSheetsExist()
Verifies that all sheets exist before export. Shows which core sheets are required and which additional sheets are optional.

### testExportUsers()
Exports only the Users table for testing. Shows first 3 records.

### countAllRecords()
Counts records in all 21 tables without exporting. Quick overview of data size.

**Usage:**
```javascript
// In Apps Script editor:
1. Select the function from the dropdown
2. Click Run
3. View results in Logs
```

---

## Troubleshooting

### ⚠️ "Logging output too large. Truncating output."

**Problem:** Your dataset is too large to display in the Apps Script log viewer.

**Solution 1 (Recommended): Use exportToGoogleDrive()**
1. Select function: `exportToGoogleDrive`
2. Click Run
3. Get the file URL from the logs
4. Download from Google Drive

**Solution 2: Export in batches**
1. Run `exportCoreToGoogleDrive()` to get 9 core tables
2. Run `exportAdditionalToGoogleDrive()` to get 12 additional tables
3. Merge the two JSON files manually

**Solution 3: Use console.log() to get file URL**
1. The `exportToGoogleDrive()` function always returns the URL
2. Even if logs are truncated, the file is created in Drive
3. Check your Google Drive for files named `ProjectFlow_Migration_Data_*.json`

### Error: "Cannot find sheet 'Users'"
- Check that your sheet name exactly matches the SCHEMA definition
- Sheet names are case-sensitive
- Core sheets (Users, Tasks, etc.) are required

### Error: "Authorization required"
- Click "Review Permissions"
- Sign in with your Google account
- Click "Allow" to grant spreadsheet access
- The script needs access to both Spreadsheet and Drive

### Error: "Execution timeout"
- Your spreadsheet is very large (>20,000 records)
- Try running the export during off-peak hours
- GAS has a 6-minute execution limit
- **Solution**: Use `exportToGoogleDrive()` which saves directly without logging

### JSON looks incomplete
- Check if the script timed out
- Check the Execution log for errors
- Make sure you copied the ENTIRE JSON (from opening `{` to closing `}`)
- **Better solution**: Use `exportToGoogleDrive()` to avoid copy/paste errors

### Empty arrays for some tables
- This is normal if those sheets don't exist or are empty
- Additional tables (Comments, Checklists, etc.) are optional
- Check logs for "⚠️  Info: [SheetName] not found (optional)"

---

## Key Differences from v1.x

**v2.0 matches the ACTUAL GAS project schema:**

**Added 7 new tables:**
- Comments (task discussions)
- History (task activity logs)
- Holidays (holiday calendar)
- Requests (user requests)
- Config (app configuration)
- Permissions (permission definitions)
- RolePermissions (role-permission mappings)

**Fixed column mappings:**
- Projects: Now has ACTION_PLAN_ID, DATE_DELETED, USER_DELETED (removed START_DATE, END_DATE, COLOR)
- Checklists: Matches actual GAS schema (6 columns)
- HospMissions: Now has START_YEAR, END_YEAR (removed ORDER)
- ITGoals: Simplified to 3 columns (removed DESCRIPTION, ORDER)
- ActionPlans: Now has IT_GOAL_IDS (JSON array) instead of single IT_GOAL_ID

**Total: 21 tables (9 core + 12 additional)**

---

## Next Steps

After successfully exporting the data:

1. ✅ Verify `migration_data.json` is valid JSON
2. ✅ Check record counts match your expectations
3. ✅ Store file securely (contains sensitive data)
4. ➡️ Proceed to **PostgreSQL import** using migration scripts
5. ➡️ Follow instructions in `../01_DATABASE_MIGRATION.md`

---

## Available Functions Summary

The export script includes several functions for different use cases:

**Main Functions:**
- `exportAllDataForMigration()` - Export all 21 tables to log (use for small datasets)
- `exportToGoogleDrive()` - Export all 21 tables to Google Drive file (recommended for large datasets)

**Partial Export Functions:**
- `exportCoreTables()` - Export only 9 core tables to log
- `exportAdditionalTables()` - Export only 12 additional tables to log
- `exportCoreToGoogleDrive()` - Export 9 core tables to Drive
- `exportAdditionalToGoogleDrive()` - Export 12 additional tables to Drive

**Utility Functions:**
- `checkAllSheetsExist()` - Verify all sheets exist before exporting
- `testExportUsers()` - Test export with Users table only
- `countAllRecords()` - Count records without exporting

**Recommendation:**
- **Small datasets (<5,000 records)**: Use `exportAllDataForMigration()`
- **Large datasets (>5,000 records)**: Use `exportToGoogleDrive()`
- **Very large datasets (>20,000 records)**: Use batch exports (`exportCoreToGoogleDrive()` + `exportAdditionalToGoogleDrive()`)

---

**Questions or Issues?**

Refer to:
- `../01_DATABASE_MIGRATION.md` - Full migration guide
- `../README.md` - Migration plan overview
- Google Apps Script documentation: https://developers.google.com/apps-script

**Version:** 2.0
**Last Updated:** 2025-10-20
**Compatible with:** Original GAS project schema (Code.gs)
