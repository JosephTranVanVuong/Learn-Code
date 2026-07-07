import type { ApiClient } from "../api-client";
import type {
  LoansByPeriodPoint,
  MostBorrowedBook,
  OverdueSummaryItem,
  PatronActivityItem,
  ReportsOverview,
} from "../schemas/report.schema";

export function createReportsApi(client: ApiClient) {
  return {
    overview: () => client.get<ReportsOverview>("/api/v1/reports/overview"),
    mostBorrowed: (limit = 10) =>
      client.get<MostBorrowedBook[]>(`/api/v1/reports/most-borrowed?limit=${limit}`),
    overdueSummary: () => client.get<OverdueSummaryItem[]>("/api/v1/reports/overdue-summary"),
    loansByPeriod: (days = 30) =>
      client.get<LoansByPeriodPoint[]>(`/api/v1/reports/loans-by-period?days=${days}`),
    patronActivity: (limit = 10) =>
      client.get<PatronActivityItem[]>(`/api/v1/reports/patron-activity?limit=${limit}`),
  };
}
