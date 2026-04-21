import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useDocuments } from "../features/documents/documents.hooks";
import {
    openDocumentInNewTab,
    downloadDocumentFile,
} from "../features/documents/documents.api";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function getApiErrorMessage(error: unknown, fallback: string) {
    if (isAxiosError<{ message?: string }>(error)) {
        const apiMessage = error.response?.data?.message;
        if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
            return apiMessage;
        }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }

    return fallback;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DOCUMENT_CATEGORIES = [
    "REGLAMENTO",
    "ACTAS",
    "FINANZAS",
    "MANTENCIONES",
    "COMUNICADOS",
    "OTROS",
];

function getCategoryLabel(category: string) {
    const map: Record<string, string> = {
        REGLAMENTO: "Reglamento",
        ACTAS: "Actas",
        FINANZAS: "Finanzas",
        MANTENCIONES: "Mantenciones",
        COMUNICADOS: "Comunicados",
        OTROS: "Otros",
    };

    return map[category] ?? category;
}

export default function DocumentsPage() {
    const [category, setCategory] = useState("");
    const [search, setSearch] = useState("");

    const filters = useMemo(
        () => ({
            category,
            search,
        }),
        [category, search],
    );

    const documentsQuery = useDocuments(filters);
    const items = documentsQuery.data?.items ?? [];

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-7 text-white">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Documentos
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-200">
                        Consulta reglamentos, actas, archivos financieros y documentos
                        compartidos por la administración.
                    </p>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Buscar
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Título, descripción o archivo"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Categoría
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                        >
                            <option value="">Todas las categorías</option>
                            {DOCUMENT_CATEGORIES.map((item) => (
                                <option key={item} value={item}>
                                    {getCategoryLabel(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Resultados
                        </label>
                        <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                            {documentsQuery.isLoading ? "Cargando..." : `${items.length} documento(s)`}
                        </div>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Archivos disponibles
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Descarga o abre los documentos publicados para tu condominio.
                    </p>
                </div>

                {documentsQuery.isLoading ? (
                    <div className="divide-y divide-slate-100">
                        <DocumentSkeleton />
                        <DocumentSkeleton />
                        <DocumentSkeleton />
                    </div>
                ) : documentsQuery.isError ? (
                    <div className="px-6 py-12">
                        <EmptyState
                            title="No se pudieron cargar los documentos"
                            description={getApiErrorMessage(
                                documentsQuery.error,
                                "Intenta nuevamente en unos momentos.",
                            )}
                            tone="error"
                        />
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-6 py-12">
                        <EmptyState
                            title="No hay documentos disponibles"
                            description="Todavía no se han publicado documentos para los filtros seleccionados."
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {items.map((document) => (
                            <div
                                key={document.id}
                                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            {document.title}
                                        </h3>
                                        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                            {getCategoryLabel(document.category)}
                                        </span>
                                    </div>

                                    {document.description ? (
                                        <p className="mt-2 text-sm text-slate-600">
                                            {document.description}
                                        </p>
                                    ) : null}

                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                        <span>{document.originalName}</span>
                                        <span>{formatBytes(document.sizeBytes)}</span>
                                        <span>{new Date(document.createdAt).toLocaleString("es-CL")}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openDocumentInNewTab(document.id)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                                    >
                                        Ver
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => downloadDocumentFile(document.id, document.originalName)}
                                        className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300"
                                    >
                                        Descargar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function EmptyState({
    title,
    description,
    tone = "default",
}: {
    title: string;
    description: string;
    tone?: "default" | "error";
}) {
    return (
        <div className="mx-auto max-w-md text-center">
            <div
                className={cn(
                    "text-sm font-semibold",
                    tone === "error" ? "text-red-600" : "text-slate-700",
                )}
            >
                {title}
            </div>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
    );
}

function DocumentSkeleton() {
    return (
        <div className="animate-pulse px-6 py-5">
            <div className="h-4 w-52 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
            <div className="mt-4 h-3 w-48 rounded bg-slate-100" />
        </div>
    );
}