const ACCESS_KEY = "lv_access_token";
const REFRESH_KEY = "lv_refresh_token";
const CONDO_KEY = "lv_condo_id";

export const storage = {
    getAccessToken() {
        return localStorage.getItem(ACCESS_KEY);
    },
    setAccessToken(token: string) {
        localStorage.setItem(ACCESS_KEY, token);
    },
    getRefreshToken() {
        return localStorage.getItem(REFRESH_KEY);
    },
    setRefreshToken(token: string) {
        localStorage.setItem(REFRESH_KEY, token);
    },
    clearTokens() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },

    // Condo actual (para armar /condominiums/:condoId/*)
    getCondoId() {
        return localStorage.getItem(CONDO_KEY) || "violetas-condo";
    },
    setCondoId(condoId: string) {
        localStorage.setItem(CONDO_KEY, condoId);
    },
};