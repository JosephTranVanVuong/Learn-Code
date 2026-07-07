import { createApiClient } from "@thuvien/shared";
import { mobileTokenStore } from "./token-store";

export const apiClient = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000",
  tokenStore: mobileTokenStore,
  withCredentials: false,
  defaultHeaders: { "x-client-platform": "mobile" },
});
