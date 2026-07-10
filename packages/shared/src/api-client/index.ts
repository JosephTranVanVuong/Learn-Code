export interface TokenStore {
  getAccessToken(): Promise<string | null> | string | null;
  getRefreshToken(): Promise<string | null> | string | null;
  setTokens(tokens: { accessToken: string; refreshToken?: string }): Promise<void> | void;
  clearTokens(): Promise<void> | void;
}

export interface ApiClientOptions {
  baseUrl: string;
  tokenStore: TokenStore;
  /** Web: true (refresh token travels as an httpOnly cookie). Mobile: false (refresh token sent explicitly). */
  withCredentials?: boolean;
  /** Sent on every request, e.g. { "x-client-platform": "web" | "mobile" }. */
  defaultHeaders?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Lỗi API (${status})`);
    this.status = status;
    this.body = body;
  }
}

/**
 * One client shape shared by Next.js (web) and Expo (mobile). Only how tokens
 * are stored/injected differs per platform (see TokenStore implementations
 * in apps/web and apps/mobile) — request semantics are identical.
 */
export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, tokenStore, withCredentials = false, defaultHeaders = {} } = options;
  let refreshPromise: Promise<string | null> | null = null;

  async function doRefresh(): Promise<string | null> {
    const refreshToken = await tokenStore.getRefreshToken();
    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...defaultHeaders },
      credentials: withCredentials ? "include" : "omit",
      body: JSON.stringify(withCredentials ? {} : { refreshToken }),
    });

    if (!res.ok) {
      await tokenStore.clearTokens();
      return null;
    }

    const data = (await res.json()) as { accessToken: string; refreshToken?: string };
    await tokenStore.setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken;
  }

  async function fetchWithAuth(path: string, init: RequestInit = {}, allowRetry = true): Promise<Response> {
    const accessToken = await tokenStore.getAccessToken();
    const headers = new Headers(init.headers);
    for (const [key, value] of Object.entries(defaultHeaders)) {
      headers.set(key, value);
    }
    if (!headers.has("Content-Type") && typeof init.body === "string") {
      headers.set("Content-Type", "application/json");
    }
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: withCredentials ? "include" : "omit",
    });

    if (res.status === 401 && allowRetry) {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        return fetchWithAuth(path, init, false);
      }
    }

    return res;
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetchWithAuth(path, init);

    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        // no JSON body
      }
      throw new ApiError(res.status, body);
    }

    if (res.status === 204) {
      return undefined as T;
    }
    return (await res.json()) as T;
  }

  async function requestBlob(path: string, init: RequestInit = {}): Promise<Blob> {
    const res = await fetchWithAuth(path, init);

    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        // no JSON body
      }
      throw new ApiError(res.status, body);
    }

    return res.blob();
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
    /** For file uploads: pass a FormData body — the correct multipart boundary is set automatically. */
    upload: <T>(path: string, formData: FormData) => request<T>(path, { method: "POST", body: formData }),
    /** For binary downloads (e.g. generated Excel files). */
    getBlob: (path: string) => requestBlob(path, { method: "GET" }),
    /** For binary downloads that require a request body (e.g. generated Word files from a selection). */
    postBlob: (path: string, body?: unknown) =>
      requestBlob(path, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
        headers: { "Content-Type": "application/json" },
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
