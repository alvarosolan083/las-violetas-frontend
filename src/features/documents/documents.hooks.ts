import { useQuery } from "@tanstack/react-query";
import {
    listDocuments,
} from "./documents.api";
import type {
    DocumentsFilters,
    DocumentsListResponse,
} from "./documents.api";

export const DOCUMENTS_QUERY_KEYS = {
    all: ["documents"] as const,
    list: (filters: DocumentsFilters) =>
        [
            "documents",
            "list",
            filters.category ?? "",
            filters.search ?? "",
        ] as const,
};

export function useDocuments(filters: DocumentsFilters = {}) {
    return useQuery<DocumentsListResponse>({
        queryKey: DOCUMENTS_QUERY_KEYS.list(filters),
        queryFn: () => listDocuments(filters),
        retry: 1,
    });
}