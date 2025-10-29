/**
 * Fiscal Year Store - Global fiscal year filter state management
 * Manages fiscal year selection with localStorage persistence
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getCurrentFiscalYear, getAvailableFiscalYears } from '@/lib/fiscal-year';

// Store state interface
interface FiscalYearState {
  // State
  selectedYears: number[]; // Array of selected fiscal years (e.g., [2568, 2567])

  // Actions
  setSelectedYears: (years: number[]) => void; // Update selection (min 1 year required)
  resetToCurrentYear: () => void; // Reset to current fiscal year only
  selectAllYears: () => void; // Select all 5 available years
}

// Get default state
const getDefaultState = (): Pick<FiscalYearState, 'selectedYears'> => ({
  selectedYears: [getCurrentFiscalYear()],
});

export const useFiscalYearStore = create<FiscalYearState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - default to current fiscal year
        ...getDefaultState(),

        // Actions
        setSelectedYears: (years) => {
          // Validation: Must have at least 1 year selected
          if (!years || years.length === 0) {
            console.warn(
              '[FiscalYearStore] Cannot select empty array. Keeping current selection.'
            );
            return;
          }

          // Validation: Years must be valid numbers
          const validYears = years.filter((year) => {
            const isValid = typeof year === 'number' && year >= 2564 && year <= 2570;
            if (!isValid) {
              console.warn(`[FiscalYearStore] Invalid year: ${year}. Skipping.`);
            }
            return isValid;
          });

          if (validYears.length === 0) {
            console.warn(
              '[FiscalYearStore] No valid years provided. Keeping current selection.'
            );
            return;
          }

          // Sort years in descending order (newest first)
          const sortedYears = [...validYears].sort((a, b) => b - a);

          set({ selectedYears: sortedYears });
        },

        resetToCurrentYear: () => {
          const currentYear = getCurrentFiscalYear();
          set({ selectedYears: [currentYear] });
        },

        selectAllYears: () => {
          const allYears = getAvailableFiscalYears();
          set({ selectedYears: allYears });
        },
      }),
      {
        name: 'fiscal-year-filter', // localStorage key
        // Persist all state
        partialize: (state) => ({
          selectedYears: state.selectedYears,
        }),
      }
    ),
    {
      name: 'FiscalYearStore',
    }
  )
);

/**
 * Helper hook to get formatted fiscal year badge text
 * @returns Formatted badge text based on selection
 *
 * @example
 * // 1 year selected
 * useFiscalYearBadgeText() // "2568"
 *
 * @example
 * // 2-3 years selected
 * useFiscalYearBadgeText() // "2567, 2568"
 *
 * @example
 * // 4-5 years selected
 * useFiscalYearBadgeText() // "ทุกปี"
 */
export function useFiscalYearBadgeText(): string {
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);

  if (selectedYears.length === 1) {
    return selectedYears[0].toString();
  }

  if (selectedYears.length >= 4) {
    return 'ทุกปี';
  }

  // 2-3 years: show comma-separated (sorted descending)
  return selectedYears.sort((a, b) => b - a).join(', ');
}

/**
 * Helper hook to check if filter is at default state (current year only)
 * @returns True if only current year is selected
 */
export function useIsDefaultFiscalYear(): boolean {
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);
  const currentYear = getCurrentFiscalYear();

  return selectedYears.length === 1 && selectedYears[0] === currentYear;
}
