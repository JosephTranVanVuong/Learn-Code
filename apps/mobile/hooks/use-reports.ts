import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../lib/resources";

export function useReportsOverview(enabled = true) {
  return useQuery({ queryKey: ["reports", "overview"], queryFn: () => reportsApi.overview(), enabled });
}

export function useMostBorrowed(limit = 10) {
  return useQuery({
    queryKey: ["reports", "most-borrowed", limit],
    queryFn: () => reportsApi.mostBorrowed(limit),
  });
}

export function useOverdueSummary(enabled = true) {
  return useQuery({
    queryKey: ["reports", "overdue-summary"],
    queryFn: () => reportsApi.overdueSummary(),
    enabled,
  });
}

export function useLoansByPeriod(days = 14) {
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
