import * as SecureStore from "expo-secure-store";
import type { TokenStore } from "@thuvien/shared";

const REFRESH_TOKEN_KEY = "thuvien.refreshToken";

// Mobile has no reliable cookie jar across app restarts, so the refresh
// token is persisted in SecureStore (Keychain/Keystore-backed) and sent
// explicitly on refresh calls. The access token only ever lives in memory.
let accessToken: string | null = null;

export const mobileTokenStore: TokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setTokens: async ({ accessToken: newAccessToken, refreshToken }) => {
    accessToken = newAccessToken;
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  clearTokens: async () => {
    accessToken = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
