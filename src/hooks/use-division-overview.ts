/**
 * Division Overview Hook
 * React Query hook for fetching division-level overview data
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useFiscalYearStore } from "@/stores/use-fiscal-year-store";
import type {
  DivisionOverview,
  DivisionFilters,
} from "@/types/division";

// Query keys factory
export const divisionKeys = {
  all: ["divisions"] as const,
  overviews: () => [...divisionKeys.all, "overview"] as const,
  overview: (divisionId: string, filters: DivisionFilters, fiscalYears: number[]) =>
    [...divisionKeys.overviews(), divisionId, filters, fiscalYears] as const,
};

/**
 * Fetch division overview data
 */
async function fetchDivisionOverview(
  divisionId: string,
  filters: DivisionFilters,
  fiscalYears: number[]
): Promise<DivisionOverview> {
  try {
    const params: Record<string, string> = {};

    // Fiscal year filtering
    if (fiscalYears && fiscalYears.length > 0) {
      params.fiscalYears = fiscalYears.join(",");
    }

    if (filters.includeCompleted !== undefined) {
      params.includeCompleted = String(filters.includeCompleted);
    }

    console.log("[fetchDivisionOverview] Fetching with params:", {
      divisionId,
      params,
    });

    const response = await api.get<DivisionOverview>(
      `/api/divisions/${divisionId}/overview`,
      { params }
    );

    console.log("[fetchDivisionOverview] Response received:", response);

    if (!response) {
      throw new Error("API returned undefined response");
    }

    return response;
  } catch (error) {
    console.error("[fetchDivisionOverview] Error:", error);
    throw error;
  }
}

/**
 * Hook: useDivisionOverview
 *
 * Fetches division-level overview with stats, department comparisons,
 * chart data, and critical tasks
 *
 * @param divisionId - Division ID
 * @param filters - Filter options (date range, fiscal years, etc.)
 * @param options - React Query options
 *
 * @example
 * const { data, isLoading, error } = useDivisionOverview(
 *   "DIV-037",
 *   {
 *     startDate: "2025-10-01",
 *     endDate: "2025-10-31",
 *     includeCompleted: false,
 *   }
 * );
 */
export function useDivisionOverview(
  divisionId: string,
  filters: DivisionFilters = {},
  options?: Omit<
    UseQueryOptions<DivisionOverview, Error>,
    "queryKey" | "queryFn"
  >
) {
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);

  console.log("[useDivisionOverview] Fiscal years from store:", selectedYears);
  console.log("[useDivisionOverview] Filters:", filters);

  return useQuery<DivisionOverview, Error>({
    queryKey: divisionKeys.overview(divisionId, filters, selectedYears),
    queryFn: () => fetchDivisionOverview(divisionId, filters, selectedYears),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!divisionId,
    ...options,
  });
}
