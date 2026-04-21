// src/features/auth/useCondoAccess.ts
import { useAuth } from "./AuthContext";

export function useCondoAccess() {
    const { membership } = useAuth();

    const role = membership?.role ?? null;
    const isAdministrador = role === "ADMINISTRADOR";
    const isComite = role === "COMITE";
    const isCopropietario = role === "COPROPIETARIO";

    const canManageReservations = isAdministrador || isComite;
    const canManageTicketWorkflow = isAdministrador || isComite || isCopropietario;
    const canEditTicketDetails = isAdministrador || isComite;
    const canCloseTickets = isAdministrador || isComite;
    const canDeleteTicketAttachments = isAdministrador || isComite;
    const canManageDocuments = isAdministrador || isComite;
    const canManageAnnouncements = isAdministrador || isComite;

    return {
        role,
        isAdministrador,
        isComite,
        isCopropietario,
        canManageReservations,
        canManageTicketWorkflow,
        canEditTicketDetails,
        canCloseTickets,
        canDeleteTicketAttachments,
        canManageDocuments,
        canManageAnnouncements,
    };
}
