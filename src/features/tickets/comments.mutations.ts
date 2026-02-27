import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "./comments.api";

export function useCreateComment() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (input: { condoId: string; ticketId: string; message: string }) =>
            commentsApi.create(input),
        onSuccess: async (_data, vars) => {
            await qc.invalidateQueries({ queryKey: ["tickets", "comments", vars.condoId, vars.ticketId] });
            await qc.invalidateQueries({ queryKey: ["tickets", "timeline", vars.condoId, vars.ticketId] });
        },
    });
}