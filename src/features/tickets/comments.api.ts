import { http } from "../../lib/http";

export type TicketComment = {
    id: string;
    ticketId: string;
    createdAt: string;
    message: string;
    createdBy?: { id: string; name: string | null; email: string };
};

export const commentsApi = {
    list(condoId: string, ticketId: string) {
        return http
            .get(`/condominiums/${condoId}/tickets/${ticketId}/comments`)
            .then((r) => r.data as TicketComment[]);
    },

    create(input: { condoId: string; ticketId: string; message: string }) {
        const { condoId, ticketId, ...body } = input;
        return http
            .post(`/condominiums/${condoId}/tickets/${ticketId}/comments`, body)
            .then((r) => r.data);
    },
};