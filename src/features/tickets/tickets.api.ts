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

export type UpdateTicketDetailsInput = {
    condoId: string;
    ticketId: string;
    title?: string;
    description?: string;
    category?: string;
};

export type TicketAttachment = {
    id: string;
    ticketId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    fileUrl?: string;
    createdAt?: string;
};

export type TicketEventType =
    | "TICKET_CREATED"
    | "STATUS_CHANGED"
    | "PRIORITY_CHANGED"
    | "COMMENT_CREATED"
    | "ATTACHMENT_ADDED"
    | "ATTACHMENT_DELETED"
    | "TICKET_CLOSED"
    | "DETAILS_UPDATED";

export type TicketTimelineEvent = {
    id: string;
    ticketId: string;
    type: TicketEventType;
    createdAt: string;
    message?: string | null;
    payload?: Record<string, unknown> | null;
    actorId?: string | null;
    actor?: {
        name: string | null;
        email: string;
    } | null;
};

export type TicketTimelineResponse = {
    ticketId: string;
    timeline: TicketTimelineEvent[];
};

export const ticketsApi = {
    attachments: {
        list(input: { condoId: string; ticketId: string }) {
            const { condoId, ticketId } = input;
            return http
                .get(`/condominiums/${condoId}/tickets/${ticketId}/attachments`)
                .then((r) => r.data as TicketAttachment[]);
        },

        create(input: { condoId: string; ticketId: string; file: File }) {
            const { condoId, ticketId, file } = input;
            const formData = new FormData();
            formData.append("file", file);

            return http
                .post(
                    `/condominiums/${condoId}/tickets/${ticketId}/attachments`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                )
                .then((r) => r.data as TicketAttachment);
        },

        delete: async ({
            condoId,
            ticketId,
            attachmentId,
        }: {
            condoId: string;
            ticketId: string;
            attachmentId: string;
        }) => {
            await http.delete(
                `/condominiums/${condoId}/tickets/${ticketId}/attachments/${attachmentId}`
            );
        },
    },

    list(p: TicketsListParams) {
        const { condoId, ...query } = p;
        return http
            .get<TicketsListResponse>(`/condominiums/${condoId}/tickets`, {
                params: query,
            })
            .then((r) => r.data);
    },

    get(condoId: string, ticketId: string) {
        return http
            .get(`/condominiums/${condoId}/tickets/${ticketId}`)
            .then((r) => r.data);
    },

    timeline(condoId: string, ticketId: string) {
        return http
            .get<TicketTimelineResponse>(
                `/condominiums/${condoId}/tickets/${ticketId}/timeline`
            )
            .then((r) => r.data);
    },

    create(input: CreateTicketInput) {
        const { condoId, ...body } = input;
        return http
            .post(`/condominiums/${condoId}/tickets`, body)
            .then((r) => r.data);
    },

    updateStatus(input: {
        condoId: string;
        ticketId: string;
        status: TicketStatus;
    }) {
        const { condoId, ticketId, ...body } = input;
        return http
            .patch(`/condominiums/${condoId}/tickets/${ticketId}/status`, body)
            .then((r) => r.data);
    },

    updatePriority(input: {
        condoId: string;
        ticketId: string;
        priority: TicketPriority;
    }) {
        const { condoId, ticketId, ...body } = input;
        return http
            .patch(`/condominiums/${condoId}/tickets/${ticketId}/priority`, body)
            .then((r) => r.data);
    },

    updateDetails(input: UpdateTicketDetailsInput) {
        const { condoId, ticketId, ...body } = input;
        return http
            .patch(`/condominiums/${condoId}/tickets/${ticketId}`, body)
            .then((r) => r.data);
    },
};

function extractFilename(
    headers: Record<string, string>,
    fallback: string
): string {
    const disposition = headers["content-disposition"] as string | undefined;

    if (disposition) {
        const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);

        const asciiMatch = disposition.match(/filename="?([^"]+)"?/i);
        if (asciiMatch?.[1]) return asciiMatch[1];
    }

    return fallback;
}

export async function openTicketAttachmentInNewTab(
    condoId: string,
    ticketId: string,
    attachmentId: string
): Promise<void> {
    const response = await http.get(
        `/condominiums/${condoId}/tickets/${ticketId}/attachments/${attachmentId}/view`,
        { responseType: "blob" }
    );

    const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
    });

    const blobUrl = URL.createObjectURL(blob);
    const opened = window.open(blobUrl, "_blank", "noopener,noreferrer");

    if (!opened) {
        URL.revokeObjectURL(blobUrl);
        throw new Error("El navegador bloqueó la apertura de la nueva pestaña.");
    }

    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export async function downloadTicketAttachmentFile(
    condoId: string,
    ticketId: string,
    attachmentId: string,
    fallbackName = "adjunto"
): Promise<void> {
    const response = await http.get(
        `/condominiums/${condoId}/tickets/${ticketId}/attachments/${attachmentId}/download`,
        { responseType: "blob" }
    );

    const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
    });

    const fileName = extractFilename(
        response.headers as Record<string, string>,
        fallbackName
    );

    const blobUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}