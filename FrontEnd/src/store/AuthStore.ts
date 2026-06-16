import { create } from "zustand";
import type { AuthUser } from "../types/auth";
import axios from "axios";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: AuthUser & { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),

  setAuth: (data) => {
    const user = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      linkedinUrl: data.linkedinUrl,
      department: data.department,
    };

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    set({
      user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  },

  logout: () => {
    localStorage.clear();

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  },

  updateUser: (updatedUser) => {
    set((state) => {
      if (!state.user) return {};
      const newUser = { ...state.user, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  initializeAuth: async () => {
    const token = localStorage.getItem("accessToken");
    const rToken = localStorage.getItem("refreshToken");
    if (!token) {
      set({ user: null, accessToken: null, refreshToken: null });
      return;
    }
    try {
      const response = await axios.get("http://localhost:8080/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = {
        userId: response.data.userId,
        fullName: response.data.fullName,
        email: response.data.email,
        role: response.data.role,
        linkedinUrl: response.data.linkedinUrl,
        department: response.data.department,
      };
      set({
        user,
        accessToken: token,
        refreshToken: rToken
      });
      localStorage.setItem("user", JSON.stringify(user));
    } catch (error) {
      console.error("Token validation failed on startup:", error);
      if (rToken) {
        try {
          const refreshResponse = await axios.post("http://localhost:8080/api/auth/refresh", {
            refreshToken: rToken,
          });
          const data = refreshResponse.data;
          const user = {
            userId: data.userId,
            fullName: data.fullName,
            email: data.email,
            role: data.role,
            linkedinUrl: data.linkedinUrl,
            department: data.department,
          };
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          set({
            user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          });
          return;
        } catch (refreshErr) {
          console.error("Refresh token failed on startup:", refreshErr);
        }
      }
      localStorage.clear();
      set({ user: null, accessToken: null, refreshToken: null });
    }
  }
}));