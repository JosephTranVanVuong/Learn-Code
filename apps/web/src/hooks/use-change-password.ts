"use client";

import { useMutation } from "@tanstack/react-query";
import type { ChangePasswordInput } from "@thuvien/shared";
import { authApi } from "@/lib/resources";

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
  });
}
