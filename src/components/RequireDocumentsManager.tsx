// src/components/RequireDocumentsManager.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useCondoAccess } from "../features/auth/useCondoAccess";

export function RequireDocumentsManager({
    children,
}: {
    children: ReactNode;
}) {
    const { canManageDocuments } = useCondoAccess();

    if (!canManageDocuments) {
        return <Navigate to="/documents" replace />;
    }

    return <>{children}</>;
}
