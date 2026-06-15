export type Role = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  linkedinUrl?: string;
}

export interface AuthResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
}