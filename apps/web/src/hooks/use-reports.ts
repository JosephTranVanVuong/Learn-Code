"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/resources";

export function useReportsOverview() {
  return useQuery({ queryKey: ["reports", "overview"], queryFn: () => reportsApi.overview() });
}

export function useMostBorrowed(limit = 10) {
  return useQuery({
    queryKey: ["reports", "most-borrowed", limit],
    queryFn: () => reportsApi.mostBorrowed(limit),
  });
}

export function useOverdueSummary() {
  return useQuery({
    queryKey: ["reports", "overdue-summary"],
    queryFn: () => reportsApi.overdueSummary(),
  });
}

export function useLoansByPeriod(days = 30) {
  return useQuery({
    queryKey: ["reports", "loans-by-period", days],
    queryFn: () => reportsApi.loansByPeriod(days),
  });
}

export function usePatronActivity(limit = 10) {
  return useQuery({
    queryKey: ["reports", "patron-activity", limit],
    queryFn: () => reportsApi.patronActivity(limit),
  });
}
