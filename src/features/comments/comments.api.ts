import { http } from "../../lib/http";

export type CommentItem = {
    id: string;
    message: string;
    createdAt: string;
    authorId?: string;
    authorName?: string;
};

export const commentsApi = {
    list(input: { condoId: string; ticketId: string }) {
        const { condoId, ticketId } = input;
        return http
            .get<CommentItem[]>(`/condominiums/${condoId}/tickets/${ticketId}/comments`)
            .then((r) => r.data);
    },

    create(input: { condoId: string; ticketId: string; message: string }) {
        const { condoId, ticketId, message } = input;
        return http
            .post<CommentItem>(`/condominiums/${condoId}/tickets/${ticketId}/comments`, { message })
            .then((r) => r.data);
    },
};
