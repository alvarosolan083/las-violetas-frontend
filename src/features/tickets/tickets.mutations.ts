
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "./tickets.api";
import type { CreateTicketInput, TicketStatus, TicketPriority } from "./tickets.api";

export function useCreateTicket() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateTicketInput) => ticketsApi.create(input),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["tickets"] });
        },
    });
}

export function useUpdateTicketStatus() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: { condoId: string; ticketId: string; status: TicketStatus }) =>
            ticketsApi.updateStatus(input),
        onSuccess: async (_data, vars) => {
            await qc.invalidateQueries({
                queryKey: ["tickets", "detail", vars.condoId, vars.ticketId],
            });
            await qc.invalidateQueries({
                queryKey: ["tickets", "timeline", vars.condoId, vars.ticketId],
            });
            await qc.invalidateQueries({ queryKey: ["tickets", "list"] });
        },
    });
}

export function useUpdateTicketPriority() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: { condoId: string; ticketId: string; priority: TicketPriority }) =>
            ticketsApi.updatePriority(input),
        onSuccess: async (_data, vars) => {
            await qc.invalidateQueries({
                queryKey: ["tickets", "detail", vars.condoId, vars.ticketId],
            });
            await qc.invalidateQueries({
                queryKey: ["tickets", "timeline", vars.condoId, vars.ticketId],
            });
            await qc.invalidateQueries({ queryKey: ["tickets", "list"] });
        },
    });
}

export function useCreateTicketAttachment() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: { condoId: string; ticketId: string; url: string; filename: string }) =>
            ticketsApi.attachments.create(input),
        onSuccess: async (_data, vars) => {
            await qc.invalidateQueries({
                queryKey: ["tickets", "attachments", vars.condoId, vars.ticketId],
            });
            await qc.invalidateQueries({
                queryKey: ["tickets", "timeline", vars.condoId, vars.ticketId],
            });
            await qc.invalidateQueries({
                queryKey: ["tickets", "detail", vars.condoId, vars.ticketId],
            });
        },
    });
}
