// src/features/auth/auth.hooks.ts
import { useQuery } from "@tanstack/react-query";
import { getMe, getMyCondoMembership } from "./auth.api";
import type { AuthUser, CondoMembershipMe } from "./auth.api";
import { storage } from "../../lib/storage";

const AUTH_QUERY_KEYS = {
    me: ["auth", "me"] as const,
    membership: (condoId: string) =>
        ["auth", "condo-membership", condoId] as const,
};

export function useAuthMe(enabled: boolean = true) {
    return useQuery<AuthUser>({
        queryKey: AUTH_QUERY_KEYS.me,
        queryFn: getMe,
        enabled,
        retry: 1,
    });
}

export function useCondoMembership(enabled: boolean = true) {
    const condoId = storage.getCondoId();

    return useQuery<CondoMembershipMe>({
        queryKey: condoId
            ? AUTH_QUERY_KEYS.membership(condoId)
            : ["auth", "condo-membership", "no-condo"],
        queryFn: getMyCondoMembership,
        enabled: enabled && !!condoId,
        retry: 1,
    });
}