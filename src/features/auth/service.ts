import { apiClient } from "@/src/lib/api/client";
import type { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, User } from "./types";

export const authService = {
  login: (body: LoginRequest) => apiClient<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body), auth: false }),
  register: (body: RegisterRequest) => apiClient<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body), auth: false }),
  me: () => apiClient<User>("/users/me"),
  forgotPassword: (body: ForgotPasswordRequest) => apiClient<void>("/auth/password/forgot", { method: "POST", body: JSON.stringify(body), auth: false }),
  resetPassword: (body: ResetPasswordRequest) => apiClient<void>("/auth/password/reset", { method: "POST", body: JSON.stringify(body), auth: false }),
  logout: (refresh_token: string) => apiClient<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token }), retry: false }),
};
