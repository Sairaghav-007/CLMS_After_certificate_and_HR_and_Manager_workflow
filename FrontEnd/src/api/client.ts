import axios from "axios";
import { useAuthStore } from "../store/AuthStore";

export const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const isPublicAuthRequest = 
    config.url?.includes("/auth/login") || 
    config.url?.includes("/auth/signup") || 
    config.url?.includes("/auth/refresh");

  if (!isPublicAuthRequest) {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      const response = await axios.post("http://localhost:8080/api/auth/refresh", {
        refreshToken,
      });

      useAuthStore.getState().setAuth(response.data);

      originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);
