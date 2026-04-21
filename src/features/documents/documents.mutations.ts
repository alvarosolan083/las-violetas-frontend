import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createDocument,
    deleteDocument,
} from "./documents.api";
import type { CreateDocumentDto } from "./documents.api";
import { DOCUMENTS_QUERY_KEYS } from "./documents.hooks";

export function useCreateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateDocumentDto) => createDocument(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: DOCUMENTS_QUERY_KEYS.all,
            });
        },
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (documentId: string) => deleteDocument(documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: DOCUMENTS_QUERY_KEYS.all,
            });
        },
    });
}