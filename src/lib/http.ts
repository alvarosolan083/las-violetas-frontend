import axios from "axios";
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { storage } from "./storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type RefreshResponse = { access_token: string; refresh_token: string };

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function resolveQueue(token: string | null) {
    queue.forEach((cb) => cb(token));
    queue = [];
}

async function doRefresh(client: AxiosInstance): Promise<RefreshResponse> {
    const refresh_token = storage.getRefreshToken();
    if (!refresh_token) throw new Error("No refresh token");

    const { data } = await client.post<RefreshResponse>("/auth/refresh", { refresh_token });

    storage.setAccessToken(data.access_token);
    storage.setRefreshToken(data.refresh_token);

    return data;
}

export const http = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

http.interceptors.response.use(
    (res) => res,
    async (err: AxiosError) => {
        const original = err.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const status = err.response?.status;

        if (!original) throw err;

        // Evita loop
        if (status !== 401 || original._retry) throw err;

        // No intentar refrescar si el 401 vino desde auth
        const url = original.url || "";
        if (url.includes("/auth/login") || url.includes("/auth/refresh")) throw err;

        original._retry = true;

        if (!isRefreshing) {
            isRefreshing = true;

            doRefresh(http)
                .then((data) => {
                    resolveQueue(data.access_token);
                    return data;
                })
                .catch((e) => {
                    resolveQueue(null);
                    storage.clearTokens();
                    throw e;
                })
                .finally(() => {
                    isRefreshing = false;
                });
        }

        // Espera refresh en cola
        const token = await new Promise<string | null>((resolve) => queue.push(resolve));

        if (!token) throw err;

        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
    }
);