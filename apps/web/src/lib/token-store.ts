import type { TokenStore } from "@thuvien/shared";

// Web stores only the short-lived access token in memory. The refresh token
// never touches JS — it lives in an httpOnly cookie set by the API and is
// sent automatically on credentialed requests, which is why getRefreshToken
// always returns null here (see packages/shared/src/api-client).
let accessToken: string | null = null;

export const webTokenStore: TokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => null,
  setTokens: ({ accessToken: token }) => {
    accessToken = token;
  },
  clearTokens: () => {
    accessToken = null;
  },
};
