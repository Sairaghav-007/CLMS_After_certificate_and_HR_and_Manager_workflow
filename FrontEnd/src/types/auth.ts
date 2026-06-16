export type Role = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  linkedinUrl?: string;
  department?: string;
}

export interface AuthResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
}