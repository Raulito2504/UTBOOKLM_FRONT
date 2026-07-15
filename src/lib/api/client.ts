import { API_BASE_URL } from "@/src/lib/api/config";
import { getAccessToken, getRefreshToken, updateAccessToken } from "@/src/features/auth/session";

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiErrorBody {
  error_code?: string;
  message?: string;
  detail?: unknown;
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && path !== "/auth/refresh") {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshResponse.ok) {
        const session = await refreshResponse.json() as { access_token: string };
        updateAccessToken(session.access_token);
        headers.set("Authorization", `Bearer ${session.access_token}`);
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      }
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
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
