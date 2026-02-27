import { useQuery } from "@tanstack/react-query";
import { commentsApi } from "./comments.api";

export function useTicketComments(condoId: string, ticketId: string) {
    return useQuery({
        queryKey: ["tickets", "comments", condoId, ticketId],
        queryFn: () => commentsApi.list(condoId, ticketId),
        enabled: !!condoId && !!ticketId,
    });
}