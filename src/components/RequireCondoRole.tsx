// src/components/RequireCondoRole.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useCondoAccess } from "../features/auth/useCondoAccess";

export function RequireCondoRole({
    children,
}: {
    children: ReactNode;
}) {
    const { canManageReservations } = useCondoAccess();

    if (!canManageReservations) {
        return <Navigate to="/reservations" replace />;
    }

    return <>{children}</>;
}
