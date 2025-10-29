'use client';

/**
 * Fiscal Year Store Test Page
 * URL: http://localhost:3010/test-fiscal-year
 *
 * This page tests all functionality of use-fiscal-year-store.ts
 */

import { useState, useEffect } from 'react';
import {
  useFiscalYearStore,
  useFiscalYearBadgeText,
  useIsDefaultFiscalYear,
} from '@/stores/use-fiscal-year-store';
import { getCurrentFiscalYear, getAvailableFiscalYears } from '@/lib/fiscal-year';

export default function TestFiscalYearPage() {
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);
  const setSelectedYears = useFiscalYearStore((state) => state.setSelectedYears);
  const resetToCurrentYear = useFiscalYearStore((state) => state.resetToCurrentYear);
  const selectAllYears = useFiscalYearStore((state) => state.selectAllYears);

  const badgeText = useFiscalYearBadgeText();
  const isDefault = useIsDefaultFiscalYear();

  const [testResults, setTestResults] = useState<string[]>([]);
  const [localStorageValue, setLocalStorageValue] = useState<string>('');

  // Load localStorage value on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fiscal-year-filter');
      setLocalStorageValue(stored || 'Not found');
    }
  }, [selectedYears]);

  const addTestResult = (message: string, success: boolean) => {
    const emoji = success ? '✅' : '❌';
    const result = `${emoji} ${message}`;
    setTestResults((prev) => [...prev, result]);
    console.log(result);
  };

  const runTests = () => {
    setTestResults([]);
    console.log('=== Running Fiscal Year Store Tests ===\n');

    // Test 1: Default state
    const currentYear = getCurrentFiscalYear();
    const isCurrentYearInState = selectedYears.includes(currentYear);
    addTestResult(
      `Test 1: Default state contains current year (${currentYear})`,
      isCurrentYearInState
    );

    // Test 2: Set valid years
    setSelectedYears([2567, 2568]);
    setTimeout(() => {
      const state = useFiscalYearStore.getState().selectedYears;
      const isCorrect =
        state.length === 2 && state.includes(2567) && state.includes(2568);
      addTestResult('Test 2: Set valid years [2567, 2568]', isCorrect);
    }, 100);

    // Test 3: Reject empty array
    setTimeout(() => {
      const before = useFiscalYearStore.getState().selectedYears.length;
      setSelectedYears([]);
      const after = useFiscalYearStore.getState().selectedYears.length;
      addTestResult('Test 3: Reject empty array (should keep previous)', after > 0);
    }, 200);

    // Test 4: Filter invalid years
    setTimeout(() => {
      setSelectedYears([2568, 1999, 2567] as any);
      const state = useFiscalYearStore.getState().selectedYears;
      const hasNoInvalid = !state.includes(1999);
      addTestResult('Test 4: Filter invalid years (1999 removed)', hasNoInvalid);
    }, 300);

    // Test 5: Reset to current year
    setTimeout(() => {
      resetToCurrentYear();
      const state = useFiscalYearStore.getState().selectedYears;
      const isReset = state.length === 1 && state[0] === currentYear;
      addTestResult('Test 5: Reset to current year', isReset);
    }, 400);

    // Test 6: Select all years
    setTimeout(() => {
      selectAllYears();
      const state = useFiscalYearStore.getState().selectedYears;
      const allYears = getAvailableFiscalYears();
      const isAllSelected = state.length === allYears.length;
      addTestResult(`Test 6: Select all years (${allYears.length} years)`, isAllSelected);
    }, 500);

    // Test 7-9: Badge text
    setTimeout(() => {
      resetToCurrentYear();
      setTimeout(() => {
        const badge1 = useFiscalYearBadgeText();
        addTestResult(`Test 7: Badge text (1 year) = "${badge1}"`, badge1 === currentYear.toString());
      }, 100);

      setTimeout(() => {
        setSelectedYears([2567, 2568]);
        setTimeout(() => {
          const badge2 = useFiscalYearBadgeText();
          addTestResult(`Test 8: Badge text (2 years) = "${badge2}"`, badge2.includes('2567') && badge2.includes('2568'));
        }, 100);
      }, 200);

      setTimeout(() => {
        selectAllYears();
        setTimeout(() => {
          const badge3 = useFiscalYearBadgeText();
          addTestResult(`Test 9: Badge text (5 years) = "${badge3}"`, badge3 === 'ทุกปี');
        }, 100);
      }, 400);
    }, 600);

    console.log('\n=== Tests Complete ===');
  };

  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fiscal-year-filter');
      setLocalStorageValue('Cleared');
      addTestResult('localStorage cleared', true);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Fiscal Year Store Test Page</h1>

      {/* Current State */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current State</h2>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Selected Years:</span>{' '}
            <span className="font-mono">[{selectedYears.join(', ')}]</span>
          </div>
          <div>
            <span className="font-medium">Badge Text:</span>{' '}
            <span className="font-mono">"{badgeText}"</span>
          </div>
          <div>
            <span className="font-medium">Is Default:</span>{' '}
            <span className="font-mono">{isDefault ? 'true' : 'false'}</span>
          </div>
          <div>
            <span className="font-medium">Current Fiscal Year:</span>{' '}
            <span className="font-mono">{getCurrentFiscalYear()}</span>
          </div>
        </div>
      </div>

      {/* Manual Controls */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Manual Controls</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedYears([2568])}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Set [2568]
          </button>
          <button
            onClick={() => setSelectedYears([2567, 2568])}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Set [2567, 2568]
          </button>
          <button
            onClick={() => setSelectedYears([2566, 2567, 2568])}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Set [2566, 2567, 2568]
          </button>
          <button
            onClick={resetToCurrentYear}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Reset to Current Year
          </button>
          <button
            onClick={selectAllYears}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Select All Years
          </button>
          <button
            onClick={() => setSelectedYears([])}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Try Set Empty (Should Fail)
          </button>
        </div>
      </div>

      {/* Automated Tests */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Automated Tests</h2>
        <button
          onClick={runTests}
          className="px-6 py-3 bg-primary text-primary-foreground rounded hover:bg-primary/90 font-semibold"
        >
          Run All Tests
        </button>
        {testResults.length > 0 && (
          <div className="mt-4 space-y-1 font-mono text-sm">
            {testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))}
          </div>
        )}
      </div>

      {/* localStorage Debug */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">localStorage Debug</h2>
        <div className="space-y-3">
          <div>
            <span className="font-medium">Key:</span>{' '}
            <span className="font-mono">fiscal-year-filter</span>
          </div>
          <div>
            <span className="font-medium">Value:</span>
            <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-x-auto">
              {localStorageValue}
            </pre>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const stored = localStorage.getItem('fiscal-year-filter');
                setLocalStorageValue(stored || 'Not found');
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              Refresh Value
            </button>
            <button
              onClick={clearLocalStorage}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Clear localStorage
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
        <p className="font-semibold mb-2">Test Instructions:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Run All Tests" to execute automated tests</li>
          <li>Use "Manual Controls" to test individual functions</li>
          <li>Check console for detailed logs</li>
          <li>Refresh page (F5) to verify localStorage persistence</li>
          <li>After refresh, selected years should remain the same</li>
        </ol>
      </div>
    </div>
  );
}
