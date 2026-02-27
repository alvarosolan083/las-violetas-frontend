import { http } from "../../lib/http";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketUser = {
    id: string;
    name: string | null;
    email: string;
};

export type TicketItem = {
    id: string;
    condominiumId: string;
    createdById: string;
    title: string;
    description: string;
    category: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: string;
    updatedAt: string;
    createdBy?: TicketUser;
};

export type TicketsListResponse = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: TicketItem[];
};

export type TicketsListParams = {
    condoId: string;
    page?: number;
    pageSize?: number;
    status?: TicketStatus;
    priority?: TicketPriority;
    search?: string;
};

export type CreateTicketInput = {
    condoId: string;
    title: string;
    description: string;
    category: string;
    priority: TicketPriority;
};

export type TicketAttachment = {
    id: string;
    url: string;
    filename: string;
    createdAt?: string;
};

export const ticketsApi = {
    attachments: {
        list(input: { condoId: string; ticketId: string }) {
            const { condoId, ticketId } = input;
            return http
                .get(`/condominiums/${condoId}/tickets/${ticketId}/attachments`)
                .then((r) => r.data as TicketAttachment[]);
        },

        create(input: { condoId: string; ticketId: string; url: string; filename: string }) {
            const { condoId, ticketId, ...body } = input;
            return http
                .post(`/condominiums/${condoId}/tickets/${ticketId}/attachments`, body)
                .then((r) => r.data);
        },
    },

    list(p: TicketsListParams) {
        const { condoId, ...query } = p;
        return http
            .get<TicketsListResponse>(`/condominiums/${condoId}/tickets`, { params: query })
            .then((r) => r.data);
    },

    get(condoId: string, ticketId: string) {
        return http.get(`/condominiums/${condoId}/tickets/${ticketId}`).then((r) => r.data);
    },

    timeline(condoId: string, ticketId: string) {
        return http
            .get(`/condominiums/${condoId}/tickets/${ticketId}/timeline`)
            .then((r) => r.data);
    },

    create(input: CreateTicketInput) {
        const { condoId, ...body } = input;
        return http.post(`/condominiums/${condoId}/tickets`, body).then((r) => r.data);
    },

    updateStatus(input: { condoId: string; ticketId: string; status: TicketStatus }) {
        const { condoId, ticketId, ...body } = input;
        return http
            .patch(`/condominiums/${condoId}/tickets/${ticketId}/status`, body)
            .then((r) => r.data);
    },

    updatePriority(input: { condoId: string; ticketId: string; priority: TicketPriority }) {
        const { condoId, ticketId, ...body } = input;
        return http
            .patch(`/condominiums/${condoId}/tickets/${ticketId}/priority`, body)
            .then((r) => r.data);
    },
};