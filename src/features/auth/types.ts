export type UserRole = "admin" | "teacher" | "student";

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organization_name: string;
}
export interface RefreshRequest { refresh_token: string }
export interface ForgotPasswordRequest { email: string }
export interface ResetPasswordRequest { reset_token: string; new_password: string }
export interface ForgotPasswordResponse { message: string; reset_token: string | null }
export interface MessageResponse { message: string }

export interface ApiError {
  error_code: string;
  message: string;
  detail: unknown;
  request_id: string;
}
