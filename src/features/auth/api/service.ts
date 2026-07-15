import { apiClient } from "@/src/lib/api/client";
import type { AuthResponse, ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, MessageResponse, RegisterRequest, ResetPasswordRequest, User } from "../types";

export const authService = {
  login: (body: LoginRequest) => apiClient<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: RegisterRequest) => apiClient<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me: () => apiClient<User>("/users/me"),
  forgotPassword: (body: ForgotPasswordRequest) => apiClient<ForgotPasswordResponse>("/auth/password/forgot", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body: ResetPasswordRequest) => apiClient<MessageResponse>("/auth/password/reset", { method: "POST", body: JSON.stringify(body) }),
  logout: (refresh_token: string) => apiClient<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token }) }),
};
