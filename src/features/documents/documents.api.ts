import { http } from "../../lib/http";
import { storage } from "../../lib/storage";

export type DocumentItem = {
    id: string;
    condominiumId: string;
    title: string;
    description: string | null;
    category: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    fileUrl: string;
    downloadUrl?: string;
    uploadedById: string;
    createdAt: string;
    updatedAt: string;
    uploadedBy?: {
        id: string;
        name: string;
        email: string;
    };
};

export type DocumentsListResponse = {
    items: DocumentItem[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
};

export type DocumentsFilters = {
    category?: string;
    search?: string;
};

export type CreateDocumentDto = {
    title: string;
    description?: string;
    category: string;
    file: File;
};

function getCondoIdOrThrow() {
    const condoId = storage.getCondoId();
    if (!condoId) {
        throw new Error("No condoId set in storage");
    }
    return condoId;
}

export async function listDocuments(
    filters: DocumentsFilters = {},
): Promise<DocumentsListResponse> {
    const condoId = getCondoIdOrThrow();

    const response = await http.get<DocumentsListResponse>(
        `/condominiums/${condoId}/documents`,
        {
            params: {
                category: filters.category || undefined,
                search: filters.search || undefined,
            },
        },
    );

    return {
        ...response.data,
        items: response.data.items ?? [],
    };
}

export async function createDocument(dto: CreateDocumentDto): Promise<DocumentItem> {
    const condoId = getCondoIdOrThrow();

    const formData = new FormData();
    formData.append("title", dto.title);
    formData.append("category", dto.category);

    if (dto.description?.trim()) {
        formData.append("description", dto.description.trim());
    }

    formData.append("file", dto.file);

    const response = await http.post<DocumentItem>(
        `/condominiums/${condoId}/documents`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );

    return response.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
    const condoId = getCondoIdOrThrow();
    await http.delete(`/condominiums/${condoId}/documents/${documentId}`);
}

// ---------------------------------------------------------------------------
// Blob-based view & download (authenticated, no direct URL navigation)
// ---------------------------------------------------------------------------

function extractFilename(headers: Record<string, string>, fallback: string): string {
    const disposition = headers["content-disposition"] as string | undefined;
    if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)"?/i);
        if (match?.[1]) return decodeURIComponent(match[1]);
    }
    return fallback;
}

export async function openDocumentInNewTab(documentId: string): Promise<void> {
    const condoId = getCondoIdOrThrow();

    const response = await http.get(
        `/condominiums/${condoId}/documents/${documentId}/view`,
        { responseType: "blob" },
    );

    const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
    });

    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");

    // Free memory after browser has had time to load the tab
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export async function downloadDocumentFile(
    documentId: string,
    fallbackName = "documento",
): Promise<void> {
    const condoId = getCondoIdOrThrow();

    const response = await http.get(
        `/condominiums/${condoId}/documents/${documentId}/download`,
        { responseType: "blob" },
    );

    const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
    });

    const fileName = extractFilename(response.headers as Record<string, string>, fallbackName);

    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
}