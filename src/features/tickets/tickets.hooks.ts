import { useQuery } from "@tanstack/react-query";
import { ticketsApi } from "./tickets.api";
import type { TicketsListParams } from "./tickets.api";

export function useTicketAttachments(condoId: string, ticketId: string) {
    return useQuery({
        queryKey: ["tickets", "attachments", condoId, ticketId],
        queryFn: () => ticketsApi.attachments.list({ condoId, ticketId }),
        enabled: !!condoId && !!ticketId,
    });
}

export function useTicketsList(params: TicketsListParams) {
    return useQuery({
        queryKey: ["tickets", "list", params],
        queryFn: () => ticketsApi.list(params),
    });
}

export function useTicketDetail(condoId: string, ticketId: string) {
    return useQuery({
        queryKey: ["tickets", "detail", condoId, ticketId],
        queryFn: () => ticketsApi.get(condoId, ticketId),
        enabled: !!condoId && !!ticketId,
    });
}

export function useTicketTimeline(condoId: string, ticketId: string) {
    return useQuery({
        queryKey: ["tickets", "timeline", condoId, ticketId],
        queryFn: () => ticketsApi.timeline(condoId, ticketId),
        enabled: !!condoId && !!ticketId,
    });
}