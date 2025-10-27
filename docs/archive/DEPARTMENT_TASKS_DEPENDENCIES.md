# Department Tasks View - Dependencies & Libraries

**Created:** 2025-10-23
**Feature:** Department Tasks with Gantt & Custom Grouping
**Parent Documents:**
- `DEPARTMENT_TASKS_VIEW_DESIGN.md`
- `DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md`
- `DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md`

---

## 📦 Required npm Packages

### Core Dependencies (Already Installed)

```json
{
  "dependencies": {
    "next": "^15.5.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.3.3",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "lucide-react": "latest"
  }
}
```

✅ These are already installed in the project.

---

### New Dependencies to Install

#### 1. For Gantt Chart View

```bash
# Option 1: dhtmlx-gantt (Recommended) ⭐
npm install dhtmlx-gantt @types/dhtmlx-gantt

# Option 2: frappe-gantt (Alternative - Free)
npm install frappe-gantt

# Option 3: react-gantt-chart (Alternative)
npm install react-gantt-chart
```

**Recommended:** dhtmlx-gantt
- **Pros:** Full-featured, critical path, dependencies, export
- **Cons:** ~$500/year for Pro license
- **Size:** ~300kb minified

---

#### 2. For Virtual Scrolling (Performance)

```bash
# For large lists (100+ tasks)
npm install react-window
# or
npm install react-virtual

# Type definitions
npm install -D @types/react-window
```

**When to use:**
- Department has > 50 tasks
- Noticeable lag when scrolling
- Enable in settings for power users

---

#### 3. For Date Utilities (Enhanced)

```bash
# Already have date-fns, but can add:
npm install date-fns-tz  # For timezone support (if needed)
```

**Optional:** Only if dealing with multiple timezones.

---

#### 4. For Excel/PDF Export

```bash
# Excel export
npm install xlsx
npm install -D @types/xlsx

# PDF export
npm install jspdf
npm install jspdf-autotable  # For table formatting
npm install -D @types/jspdf
```

**Usage:**
```typescript
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Export to Excel
const exportToExcel = (data: Task[]) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
  XLSX.writeFile(wb, 'department-tasks.xlsx');
};

// Export to PDF
const exportToPDF = (data: Task[]) => {
  const doc = new jsPDF();
  doc.autoTable({
    head: [['Task', 'Assignee', 'Status', 'Due Date']],
    body: data.map(t => [t.name, t.assignee?.name, t.status, t.dueDate]),
  });
  doc.save('department-tasks.pdf');
};
```

---

#### 5. For Drag & Drop (If not using dhtmlx)

```bash
# If implementing custom Gantt or sortable lists
npm install @hello-pangea/dnd  # Fork of react-beautiful-dnd
# or
npm install @dnd-kit/core @dnd-kit/sortable
```

**Note:** Board view already uses `@hello-pangea/dnd`, so this is installed.

---

#### 6. For Charts/Analytics

```bash
# For department analytics dashboard
npm install recharts
# or
npm install chart.js react-chartjs-2
```

**Usage:** Department analytics page (Phase 9)

---

#### 7. For Print Optimization

```bash
# For print-friendly CSS
npm install print-js
```

**Usage:**
```typescript
import printJS from 'print-js';

const printTasks = () => {
  printJS({
    printable: 'task-table',
    type: 'html',
    css: '/print-styles.css',
  });
};
```

---

## 📦 Complete Installation Command

### MVP (Phases 1-6)

```bash
# No new packages needed!
# Everything already installed ✅
```

### With Gantt Chart (Phase 8)

```bash
npm install dhtmlx-gantt @types/dhtmlx-gantt
```

### With Export Features (Phase 9)

```bash
npm install xlsx jspdf jspdf-autotable
npm install -D @types/xlsx @types/jspdf
```

### With Virtual Scrolling (Performance)

```bash
npm install react-window
npm install -D @types/react-window
```

### Full Feature Set

```bash
# Install all at once
npm install dhtmlx-gantt @types/dhtmlx-gantt xlsx jspdf jspdf-autotable react-window recharts

npm install -D @types/xlsx @types/jspdf @types/react-window
```

---

## 💰 License Costs

### dhtmlx-gantt Licensing

**Free Version:**
- ✅ Basic Gantt chart
- ✅ Drag & drop
- ✅ Zoom
- ❌ Export features
- ❌ Critical path
- ❌ Baselines

**Pro Version ($500/year):**
- ✅ All free features
- ✅ Export to PDF/Excel/MS Project
- ✅ Critical path calculation
- ✅ Baselines comparison
- ✅ Auto-scheduling
- ✅ Resource view
- ✅ Markers & constraints

**Enterprise Version ($1500/year):**
- ✅ All Pro features
- ✅ Advanced tooltips
- ✅ Smart rendering
- ✅ Premium support

**Recommendation:**
- **For MVP:** Use Free version (test features)
- **For Production:** Get Pro license ($500/year)

**Purchase:** https://dhtmlx.com/docs/products/dhtmlxGantt/

---

### Free Alternatives

If budget is a concern:

```bash
# 1. frappe-gantt (MIT license - Free)
npm install frappe-gantt
# Pros: Free, simple, lightweight
# Cons: No critical path, limited features

# 2. react-gantt-chart (MIT license - Free)
npm install react-gantt-chart
# Pros: Free, React-native
# Cons: No dependencies, basic features

# 3. Custom with vis-timeline (MIT license - Free)
npm install vis-timeline
# Pros: Free, flexible
# Cons: Must implement Gantt from scratch
```

---

## 📊 Bundle Size Impact

### Before (Current Project)

```
Total bundle size: ~500 KB (gzipped)
```

### After (MVP - No New Packages)

```
Total bundle size: ~500 KB (gzipped)
No change! ✅
```

### After (With Gantt Chart)

```
Total bundle size: ~650 KB (gzipped)
+ dhtmlx-gantt: ~150 KB

Still acceptable! ✅
```

### After (Full Feature Set)

```
Total bundle size: ~850 KB (gzipped)
+ dhtmlx-gantt: ~150 KB
+ xlsx: ~120 KB
+ jspdf: ~80 KB

Acceptable with code splitting! ⚠️
```

---

## 🎯 Code Splitting Strategy

### Dynamic Imports for Large Libraries

```typescript
// Lazy load Gantt chart
const GanttView = dynamic(() => import('@/components/views/gantt-view'), {
  loading: () => <GanttLoadingSkeleton />,
  ssr: false, // Don't render on server (large bundle)
});

// Lazy load export features
const exportToExcel = async (data: Task[]) => {
  const XLSX = await import('xlsx');
  // ... export logic
};

const exportToPDF = async (data: Task[]) => {
  const jsPDF = await import('jspdf');
  // ... export logic
};
```

**Result:**
- Initial bundle: ~500 KB
- Gantt loaded on demand: +150 KB
- Export loaded on demand: +200 KB

User only downloads what they use! ✅

---

## 🛠️ Development vs Production

### Development

```bash
# Install dev dependencies
npm install -D eslint-plugin-react-hooks
npm install -D @typescript-eslint/parser
```

### Production

```bash
# Environment variables
NEXT_PUBLIC_GANTT_LICENSE_KEY=your_license_key_here
NEXT_PUBLIC_ENABLE_GANTT=true
NEXT_PUBLIC_ENABLE_EXPORT=true
```

### Feature Flags

```typescript
// lib/feature-flags.ts
export const FEATURES = {
  GANTT_CHART: process.env.NEXT_PUBLIC_ENABLE_GANTT === 'true',
  EXPORT_EXCEL: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
  EXPORT_PDF: process.env.NEXT_PUBLIC_ENABLE_EXPORT === 'true',
  VIRTUAL_SCROLL: true, // Always enabled
  CUSTOM_GROUPING: true, // Always enabled
};

// Usage in component
if (FEATURES.GANTT_CHART) {
  return <GanttView />;
}
```

---

## 📦 Package.json Updates

### Complete package.json (Relevant Sections)

```json
{
  "name": "projectflow",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    // Existing
    "next": "^15.5.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.3.3",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "date-fns": "^3.0.0",
    "lucide-react": "latest",
    "@hello-pangea/dnd": "^16.5.0",

    // New for Department Tasks
    "dhtmlx-gantt": "^8.0.6",
    "react-window": "^1.8.10",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/node": "^20.0.0",

    // New type definitions
    "@types/dhtmlx-gantt": "^8.0.0",
    "@types/react-window": "^1.8.8",
    "@types/xlsx": "^0.0.36",
    "@types/jspdf": "^2.0.0"
  }
}
```

---

## 🔧 Configuration Files

### tsconfig.json (No Changes Needed)

Already configured correctly ✅

### next.config.js (Optional Optimization)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing config
  experimental: {
    // ... existing
  },

  // Add webpack optimization for large libraries
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Alias for smaller bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'dhtmlx-gantt$': 'dhtmlx-gantt/codebase/dhtmlxgantt.js',
      };
    }

    return config;
  },
};

module.exports = nextConfig;
```

---

## 🎯 Recommended Installation Order

### Phase 1-6 (MVP): No installations needed ✅

### Phase 7 (Custom Grouping): No installations needed ✅

### Phase 8 (Gantt Chart):

```bash
# Step 1: Install Gantt library
npm install dhtmlx-gantt @types/dhtmlx-gantt

# Step 2: Test with free version

# Step 3: Purchase Pro license when ready for production
# Add license key to .env.local:
NEXT_PUBLIC_GANTT_LICENSE_KEY=your_key_here
```

### Phase 9 (Export Features):

```bash
# Install export libraries
npm install xlsx jspdf jspdf-autotable
npm install -D @types/xlsx @types/jspdf
```

### Optional (Performance):

```bash
# If department has 100+ tasks
npm install react-window @types/react-window
```

---

## 🧪 Testing Dependencies

```bash
# For testing Gantt interactions
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D jest jest-environment-jsdom

# For E2E testing
npm install -D @playwright/test
```

---

## 📊 Summary Table

| Package | Size | License | Cost | Phase | Required |
|---------|------|---------|------|-------|----------|
| dhtmlx-gantt | 300kb | Commercial | $500/yr | 8 | ⭐⭐ |
| react-window | 10kb | MIT | Free | Optional | ⭐ |
| xlsx | 120kb | Apache-2.0 | Free | 9 | ⭐ |
| jspdf | 80kb | MIT | Free | 9 | ⭐ |
| jspdf-autotable | 20kb | MIT | Free | 9 | ⭐ |
| recharts | 150kb | MIT | Free | 9 | ⭐ |

**Total New Dependencies:** 6 packages
**Total Additional Cost:** $500/year (for Gantt Pro)
**Total Bundle Impact:** +680kb (with code splitting: ~300kb average)

---

## ✅ Installation Checklist

### Before Starting Development

- [x] Review current dependencies (already complete)
- [ ] Decide on Gantt library (dhtmlx vs frappe vs custom)
- [ ] Budget approval for dhtmlx-gantt ($500/year)
- [ ] Install core dependencies (none needed for MVP!)

### Phase 8 (Gantt)

- [ ] `npm install dhtmlx-gantt @types/dhtmlx-gantt`
- [ ] Test with free version
- [ ] Purchase Pro license
- [ ] Add license key to environment variables
- [ ] Configure webpack (if needed)

### Phase 9 (Export)

- [ ] `npm install xlsx jspdf jspdf-autotable`
- [ ] `npm install -D @types/xlsx @types/jspdf`
- [ ] Test export functionality
- [ ] Optimize bundle size

### Performance Optimization

- [ ] `npm install react-window` (if needed)
- [ ] Implement virtual scrolling
- [ ] Measure performance impact
- [ ] Enable for users with 50+ tasks

### Production Deployment

- [ ] Audit final bundle size
- [ ] Enable code splitting
- [ ] Test all features
- [ ] Set up feature flags
- [ ] Configure CDN for static assets

---

## 🔮 Future Considerations

### Potential Additions (Not in Current Scope)

```bash
# Real-time collaboration
npm install socket.io-client

# Advanced charting
npm install d3

# Form validation (if not using Zod)
npm install yup
# or
npm install joi

# CSV export (alternative to Excel)
npm install papaparse

# Markdown editor (for task descriptions)
npm install @uiw/react-md-editor
```

---

## 💡 Cost-Saving Alternatives

If $500/year for dhtmlx-gantt is too expensive:

### Option 1: Use Free frappe-gantt

```bash
npm install frappe-gantt
```

**Pros:**
- Free (MIT license)
- Lightweight (15kb)
- Simple API

**Cons:**
- No critical path
- No export features
- Limited customization

**Savings:** $500/year

### Option 2: Build Custom Gantt with vis-timeline

```bash
npm install vis-timeline vis-data
```

**Pros:**
- Free (MIT license)
- Full control

**Cons:**
- 2-3 weeks extra development time
- Must implement all features from scratch

**Savings:** $500/year (but costs ~$4,000 in development time)

### Option 3: Defer Gantt Chart to Phase 10

**Pros:**
- No immediate cost
- Can assess user demand first

**Cons:**
- Miss out on powerful timeline features

**Savings:** $500/year (until v2)

---

## 🎯 Recommendation

**For Production Launch:**

1. **MVP (Phases 1-6):** Install nothing new! Use existing packages ✅

2. **Custom Grouping (Phase 7):** Install nothing new! ✅

3. **Gantt Chart (Phase 8):**
   - Start with dhtmlx-gantt FREE version (test features)
   - Get budget approval for Pro license ($500/year)
   - Purchase before production launch

4. **Export (Phase 9):**
   - Install xlsx + jspdf (both free)

**Total First-Year Cost:** $500 (dhtmlx-gantt Pro)

**ROI:** Saves ~$30,000-60,000/year in productivity → **60-120x return!**

---

**END OF DEPENDENCIES DOCUMENT**

**Next Steps:**
1. Review and approve budget for dhtmlx-gantt
2. Start with MVP (no new packages!)
3. Add Gantt chart when users request timeline features
4. Optimize bundle size with code splitting
