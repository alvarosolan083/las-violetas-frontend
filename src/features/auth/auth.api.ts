import { http } from "../../lib/http";

export type LoginResponse = { access_token: string; refresh_token: string };
export type MeResponse = any;

export const authApi = {
    login(email: string, password: string) {
        return http.post<LoginResponse>("/auth/login", { email, password }).then((r) => r.data);
    },
    me() {
        return http.get<MeResponse>("/auth/me").then((r) => r.data);
    },
    logout(refresh_token?: string) {
        return http.post("/auth/logout", refresh_token ? { refresh_token } : {}).then((r) => r.data);
    },
};