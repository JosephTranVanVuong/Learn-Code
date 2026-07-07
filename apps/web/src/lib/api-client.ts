import { createApiClient } from "@thuvien/shared";
import { webTokenStore } from "./token-store";

export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  tokenStore: webTokenStore,
  withCredentials: true,
  defaultHeaders: { "x-client-platform": "web" },
});
