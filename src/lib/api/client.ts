import { API_BASE_URL } from "@/src/lib/api/config";
import { clearSession, getAccessToken, getRefreshToken, updateAccessToken } from "@/src/features/auth/session";

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string,
    message: string,
    public detail?: unknown,
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiErrorBody {
  error_code?: string;
  message?: string;
  detail?: unknown;
  request_id?: string;
}

interface ApiClientOptions extends RequestInit { auth?: boolean; retry?: boolean }
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) throw new Error("Refresh failed");
  const body = (await response.json()) as { access_token: string };
  updateAccessToken(body.access_token);
  return body.access_token;
}

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { auth = true, retry = true, ...requestOptions } = options;
  const token = auth ? getAccessToken() : null;
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (response.status === 401 && auth && retry && getRefreshToken()) {
    try {
      refreshPromise ??= refreshAccessToken().finally(() => { refreshPromise = null; });
      await refreshPromise;
      return apiClient<T>(path, { ...options, retry: false });
    } catch {
      clearSession();
      if (typeof window !== "undefined") window.location.assign("/login");
    }
  }

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // respuesta no JSON
    }

    throw new ApiError(
      response.status,
      body.error_code ?? "UNKNOWN_ERROR",
      body.message ?? `Error ${response.status}`,
      body.detail,
      body.request_id,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
