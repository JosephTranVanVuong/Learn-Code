import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateLoanInput,
  CreateLoansBatchInput,
  LoanQuery,
  RenewLoanInput,
  ReturnByBarcodeInput,
} from "@thuvien/shared";
import { loansApi } from "../lib/resources";

export function useLoans(query: Partial<LoanQuery>) {
  return useQuery({
    queryKey: ["loans", "list", query],
    queryFn: () => loansApi.list(query),
  });
}

function invalidateLoanRelated(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["loans"] });
  qc.invalidateQueries({ queryKey: ["books"] });
  qc.invalidateQueries({ queryKey: ["patrons"] });
  qc.invalidateQueries({ queryKey: ["fines"] });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLoanInput) => loansApi.create(input),
    onSuccess: () => invalidateLoanRelated(qc),
  });
}

export function useCreateLoansBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLoansBatchInput) => loansApi.createBatch(input),
    onSuccess: () => invalidateLoanRelated(qc),
  });
}

export function useReturnLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loansApi.returnLoan(id),
    onSuccess: () => invalidateLoanRelated(qc),
  });
}

export function useRenewLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RenewLoanInput }) => loansApi.renew(id, input),
    onSuccess: () => invalidateLoanRelated(qc),
  });
}

export function useReturnByBarcode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReturnByBarcodeInput) => loansApi.returnByBarcode(input),
    onSuccess: () => invalidateLoanRelated(qc),
  });
}
