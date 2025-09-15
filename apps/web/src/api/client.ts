import axios from "axios";
import { getAuthFromStorage } from "@/store/authStorage";

const apiBase =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${
        import.meta.env.VITE_API_HOST ?? "localhost"
      }:${import.meta.env.VITE_API_PORT ?? "3000"}`
    : "http://localhost:3000");

const api = axios.create({ baseURL: apiBase });

let tokenGetter: () => string | null = () =>
  getAuthFromStorage()?.token ?? null;
export const setTokenGetter = (getter: () => string | null) => {
  tokenGetter = getter;
};

api.interceptors.request.use((config) => {
  const token = tokenGetter();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, unknown>)[
      "Authorization"
    ] = `Bearer ${token}`;
  }
  return config;
});

export default api;
