// src/features/auth/auth.api.ts
import { http } from "../../lib/http";
import { storage } from "../../lib/storage";

// ─── Types ───────────────────────────────────────────────

export type LoginResponse = {
    access_token: string;
    refresh_token: string;
};

export type AuthUser = {
    id: string;
    email: string;
    name: string | null;
};

export type CondoMembershipMe = {
    condoId: string;
    role: "ADMINISTRADOR" | "COMITE" | "COPROPIETARIO";
};

// ─── Functions ───────────────────────────────────────────

export async function getMe(): Promise<AuthUser> {
    const response = await http.get<AuthUser>("/auth/me");
    return response.data;
}

export async function getMyCondoMembership(): Promise<CondoMembershipMe> {
    const condoId = storage.getCondoId();
    if (!condoId) {
        throw new Error("No condoId set in storage");
    }

    const response = await http.get<CondoMembershipMe>(
        `/condominiums/${condoId}/me`
    );
    return response.data;
}

export async function login(
    email: string,
    password: string
): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>("/auth/login", {
        email,
        password,
    });
    return response.data;
}

export async function logout(refresh_token?: string) {
    const response = await http.post(
        "/auth/logout",
        refresh_token ? { refresh_token } : {}
    );
    return response.data;
}

// ─── Backward-compat object (for existing imports) ───────

export const authApi = {
    login,
    logout,
    getMe,
    getMyCondoMembership,
};