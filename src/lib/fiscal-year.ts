/**
 * Fiscal Year Utilities
 *
 * Thai government fiscal year: October 1 - September 30
 * Buddhist calendar: Christian year + 543
 *
 * Example:
 * - Fiscal Year 2568 = Oct 1, 2024 - Sep 30, 2025
 * - Date 2024-10-29 → Fiscal Year 2568
 * - Date 2024-09-30 → Fiscal Year 2567
 */

/**
 * Get current Thai fiscal year (Buddhist calendar)
 *
 * Logic:
 * - If current month >= October (9) → next year
 * - If current month < October → current year
 *
 * @returns Current fiscal year in Buddhist calendar
 *
 * @example
 * // Date: 2024-10-29
 * getCurrentFiscalYear() // Returns 2568 (Oct 1, 2024 - Sep 30, 2025)
 *
 * @example
 * // Date: 2024-09-30
 * getCurrentFiscalYear() // Returns 2567 (Oct 1, 2023 - Sep 30, 2024)
 */
export function getCurrentFiscalYear(): number {
  const now = new Date();
  const christianYear = now.getFullYear();
  const buddhistYear = christianYear + 543;
  const month = now.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)

  // If October or later, fiscal year is next year
  // Otherwise, fiscal year is current year
  return month >= 9 ? buddhistYear + 1 : buddhistYear;
}

/**
 * Get start and end dates for a specific fiscal year
 *
 * @param fiscalYear - Thai fiscal year in Buddhist calendar
 * @returns Object with start and end dates
 *
 * @example
 * getFiscalYearRange(2568)
 * // Returns:
 * // {
 * //   start: Date('2024-10-01T00:00:00'),
 * //   end: Date('2025-09-30T23:59:59.999')
 * // }
 */
export function getFiscalYearRange(fiscalYear: number): {
  start: Date;
  end: Date;
} {
  // Convert Buddhist year to Christian year
  const christianYear = fiscalYear - 543;

  // Fiscal year starts October 1 of previous Christian year
  const start = new Date(christianYear - 1, 9, 1, 0, 0, 0, 0); // Oct 1, 00:00:00

  // Fiscal year ends September 30 of current Christian year
  const end = new Date(christianYear, 8, 30, 23, 59, 59, 999); // Sep 30, 23:59:59

  return { start, end };
}

/**
 * Get available fiscal years for filter
 *
 * Returns current year + 4 previous years (5 years total)
 *
 * @returns Array of fiscal years in descending order
 *
 * @example
 * // Current fiscal year: 2568
 * getAvailableFiscalYears()
 * // Returns: [2568, 2567, 2566, 2565, 2564]
 */
export function getAvailableFiscalYears(): number[] {
  const currentYear = getCurrentFiscalYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
}

/**
 * Build Prisma WHERE clause for fiscal year filtering
 *
 * Returns OR conditions checking if task falls within any of the selected fiscal years.
 * A task is included if ANY of these conditions are true:
 * - createdAt falls within fiscal year
 * - startDate falls within fiscal year
 * - dueDate falls within fiscal year
 *
 * @param fiscalYears - Array of fiscal years to filter by
 * @returns Prisma WHERE clause object, or empty object if no years provided
 *
 * @example
 * // Single year
 * buildFiscalYearFilter([2568])
 * // Returns:
 * // {
 * //   OR: [
 * //     { createdAt: { gte: Date('2024-10-01'), lte: Date('2025-09-30 23:59:59') } },
 * //     { startDate: { gte: Date('2024-10-01'), lte: Date('2025-09-30 23:59:59') } },
 * //     { dueDate: { gte: Date('2024-10-01'), lte: Date('2025-09-30 23:59:59') } },
 * //   ]
 * // }
 *
 * @example
 * // Multiple years
 * buildFiscalYearFilter([2567, 2568])
 * // Returns 6 OR conditions (3 fields × 2 years)
 *
 * @example
 * // Empty array (no filter)
 * buildFiscalYearFilter([])
 * // Returns: {}
 */
export function buildFiscalYearFilter(fiscalYears: number[]): any {
  // No filter if empty array
  if (!fiscalYears || fiscalYears.length === 0) {
    return {};
  }

  // Build OR conditions for each year
  const orConditions = fiscalYears.flatMap((year) => {
    const { start, end } = getFiscalYearRange(year);

    return [
      // Task created within fiscal year
      {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      // Task start date within fiscal year
      {
        startDate: {
          gte: start,
          lte: end,
        },
      },
      // Task due date within fiscal year
      {
        dueDate: {
          gte: start,
          lte: end,
        },
      },
    ];
  });

  return {
    OR: orConditions,
  };
}

/**
 * Convert Buddhist year to Christian year
 *
 * @param buddhistYear - Year in Buddhist calendar
 * @returns Year in Christian calendar
 *
 * @example
 * buddhistToChristian(2568) // Returns 2025
 */
export function buddhistToChristian(buddhistYear: number): number {
  return buddhistYear - 543;
}

/**
 * Convert Christian year to Buddhist year
 *
 * @param christianYear - Year in Christian calendar
 * @returns Year in Buddhist calendar
 *
 * @example
 * christianToBuddhist(2025) // Returns 2568
 */
export function christianToBuddhist(christianYear: number): number {
  return christianYear + 543;
}

/**
 * Check if a date falls within a specific fiscal year
 *
 * @param date - Date to check
 * @param fiscalYear - Fiscal year to check against
 * @returns True if date falls within fiscal year
 *
 * @example
 * isInFiscalYear(new Date('2024-10-15'), 2568) // Returns true
 * isInFiscalYear(new Date('2024-09-30'), 2568) // Returns false
 */
export function isInFiscalYear(date: Date | null, fiscalYear: number): boolean {
  if (!date) return false;

  const { start, end } = getFiscalYearRange(fiscalYear);
  return date >= start && date <= end;
}

/**
 * Get fiscal year for a specific date
 *
 * @param date - Date to get fiscal year for
 * @returns Fiscal year in Buddhist calendar
 *
 * @example
 * getFiscalYearFromDate(new Date('2024-10-15')) // Returns 2568
 * getFiscalYearFromDate(new Date('2024-09-30')) // Returns 2567
 */
export function getFiscalYearFromDate(date: Date): number {
  const christianYear = date.getFullYear();
  const buddhistYear = christianYear + 543;
  const month = date.getMonth();

  return month >= 9 ? buddhistYear + 1 : buddhistYear;
}

/**
 * Format fiscal year for display
 *
 * @param fiscalYear - Fiscal year to format
 * @returns Formatted string
 *
 * @example
 * formatFiscalYear(2568) // Returns "ปีงบประมาณ 2568"
 */
export function formatFiscalYear(fiscalYear: number): string {
  return `ปีงบประมาณ ${fiscalYear}`;
}

/**
 * Format fiscal year range for display
 *
 * @param fiscalYear - Fiscal year
 * @returns Formatted date range string
 *
 * @example
 * formatFiscalYearRange(2568)
 * // Returns "1 ต.ค. 2567 - 30 ก.ย. 2568"
 */
export function formatFiscalYearRange(fiscalYear: number): string {
  const { start, end } = getFiscalYearRange(fiscalYear);

  const startYear = start.getFullYear() + 543;
  const endYear = end.getFullYear() + 543;

  return `1 ต.ค. ${startYear} - 30 ก.ย. ${endYear}`;
}
