/**
 * Fiscal Year Store Manual Test
 *
 * To run this test:
 * 1. Start dev server: PORT=3010 npm run dev
 * 2. Open browser console at http://localhost:3010
 * 3. Copy and paste this code into console
 * 4. Or create a test page that imports and tests the store
 */

// Test Plan:
// 1. Test default state (should be current year)
// 2. Test setSelectedYears with valid years
// 3. Test setSelectedYears with empty array (should reject)
// 4. Test setSelectedYears with invalid years (should filter)
// 5. Test resetToCurrentYear
// 6. Test selectAllYears
// 7. Test localStorage persistence (manual - refresh page)

console.log('=== Fiscal Year Store Test ===\n');

// Note: This is a manual test plan. To actually test:
// 1. Create a test component in src/app/test-fiscal-year/page.tsx
// 2. Import useFiscalYearStore
// 3. Test all functions with console.log or UI display

const testCases = [
  {
    name: 'Test 1: Default State',
    description: 'Should default to current fiscal year ([2568])',
    code: `
const { selectedYears } = useFiscalYearStore.getState();
console.log('Default years:', selectedYears);
// Expected: [2568] (current fiscal year)
    `,
  },
  {
    name: 'Test 2: Set Valid Years',
    description: 'Should accept array of valid years',
    code: `
const { setSelectedYears } = useFiscalYearStore.getState();
setSelectedYears([2567, 2568]);
console.log('After setting [2567, 2568]:', useFiscalYearStore.getState().selectedYears);
// Expected: [2568, 2567] (sorted descending)
    `,
  },
  {
    name: 'Test 3: Reject Empty Array',
    description: 'Should keep current selection if empty array provided',
    code: `
const { setSelectedYears } = useFiscalYearStore.getState();
const before = useFiscalYearStore.getState().selectedYears;
setSelectedYears([]);
const after = useFiscalYearStore.getState().selectedYears;
console.log('Before empty:', before);
console.log('After empty:', after);
// Expected: Same array (should not change)
    `,
  },
  {
    name: 'Test 4: Filter Invalid Years',
    description: 'Should filter out invalid years',
    code: `
const { setSelectedYears } = useFiscalYearStore.getState();
setSelectedYears([2568, 1999, 2567, 'invalid', null]);
console.log('After setting mixed array:', useFiscalYearStore.getState().selectedYears);
// Expected: [2568, 2567] (only valid years)
    `,
  },
  {
    name: 'Test 5: Reset to Current Year',
    description: 'Should reset to current fiscal year',
    code: `
const { resetToCurrentYear } = useFiscalYearStore.getState();
resetToCurrentYear();
console.log('After reset:', useFiscalYearStore.getState().selectedYears);
// Expected: [2568] (current year)
    `,
  },
  {
    name: 'Test 6: Select All Years',
    description: 'Should select all 5 available years',
    code: `
const { selectAllYears } = useFiscalYearStore.getState();
selectAllYears();
console.log('After select all:', useFiscalYearStore.getState().selectedYears);
// Expected: [2568, 2567, 2566, 2565, 2564]
    `,
  },
  {
    name: 'Test 7: Badge Text Helper (1 year)',
    description: 'Should return single year as string',
    code: `
const { resetToCurrentYear } = useFiscalYearStore.getState();
resetToCurrentYear();
// Call useFiscalYearBadgeText() in component
// Expected: "2568"
    `,
  },
  {
    name: 'Test 8: Badge Text Helper (2-3 years)',
    description: 'Should return comma-separated years',
    code: `
const { setSelectedYears } = useFiscalYearStore.getState();
setSelectedYears([2567, 2568]);
// Call useFiscalYearBadgeText() in component
// Expected: "2568, 2567"
    `,
  },
  {
    name: 'Test 9: Badge Text Helper (4-5 years)',
    description: 'Should return "ทุกปี"',
    code: `
const { selectAllYears } = useFiscalYearStore.getState();
selectAllYears();
// Call useFiscalYearBadgeText() in component
// Expected: "ทุกปี"
    `,
  },
  {
    name: 'Test 10: localStorage Persistence',
    description: 'Should persist across page refresh',
    code: `
const { setSelectedYears } = useFiscalYearStore.getState();
setSelectedYears([2566, 2567]);
console.log('Before refresh:', useFiscalYearStore.getState().selectedYears);
// 1. Refresh page (F5)
// 2. Check localStorage: key 'fiscal-year-filter'
// 3. Check state after refresh
// Expected: [2567, 2566] (same as before refresh)
    `,
  },
];

// Print test plan
testCases.forEach((test, index) => {
  console.log(`\n${test.name}`);
  console.log(`Description: ${test.description}`);
  console.log(`Code:${test.code}`);
});

console.log('\n=== Manual Testing Instructions ===');
console.log('1. Create test page: src/app/test-fiscal-year/page.tsx');
console.log('2. Import: import { useFiscalYearStore, useFiscalYearBadgeText, useIsDefaultFiscalYear } from "@/stores/use-fiscal-year-store";');
console.log('3. Create UI with buttons to test each function');
console.log('4. Display current state and badge text');
console.log('5. Open browser DevTools to see console logs');
console.log('6. Test localStorage by refreshing page\n');

console.log('=== Quick Browser Console Test ===');
console.log('If useFiscalYearStore is available in window, run:');
console.log('window.useFiscalYearStore.getState().selectedYears');
console.log('window.useFiscalYearStore.getState().setSelectedYears([2567, 2568])');
console.log('window.useFiscalYearStore.getState().resetToCurrentYear()');
console.log('window.useFiscalYearStore.getState().selectAllYears()\n');
