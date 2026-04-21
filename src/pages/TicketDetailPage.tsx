import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { storage } from "../lib/storage";
import { cn } from "../lib/cn";
import { useTicketDetail, useTicketTimeline, useTicketAttachments } from "../features/tickets/tickets.hooks";
import { useCommentsList } from "../features/comments/comments.hooks";
import { useCreateComment } from "../features/comments/comments.mutations";
import type { CommentItem } from "../features/comments/comments.api";
import {
    useUpdateTicketStatus,
    useUpdateTicketPriority,
    useCreateTicketAttachment,
    useDeleteTicketAttachment,
    useUpdateTicketDetails,
} from "../features/tickets/tickets.mutations";
import {
    openTicketAttachmentInNewTab,
    downloadTicketAttachmentFile,
} from "../features/tickets/tickets.api";
import type {
    TicketStatus,
    TicketPriority,
    TicketAttachment,
    TicketTimelineEvent,
} from "../features/tickets/tickets.api";
import { useToast } from "../hooks/useToast";
import { useCondoAccess } from "../features/auth/useCondoAccess";

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatStatusLabel(status: TicketStatus) {
    const map: Record<TicketStatus, string> = {
        OPEN: "Abierto",
        IN_PROGRESS: "En progreso",
        CLOSED: "Cerrado",
    };
    return map[status];
}

function formatPriorityLabel(priority: TicketPriority) {
    const map: Record<TicketPriority, string> = {
        LOW: "Baja",
        MEDIUM: "Media",
        HIGH: "Alta",
        URGENT: "Urgente",
    };
    return map[priority];
}

function statusBadgeClass(status: TicketStatus) {
    const map: Record<TicketStatus, string> = {
        OPEN: "bg-red-100 text-red-700 border border-red-200",
        IN_PROGRESS: "bg-amber-100 text-amber-700 border border-amber-200",
        CLOSED: "bg-green-100 text-green-700 border border-green-200",
    };
    return map[status];
}

function priorityBadgeClass(priority: TicketPriority) {
    const map: Record<TicketPriority, string> = {
        LOW: "bg-slate-100 text-slate-700 border border-slate-200",
        MEDIUM: "bg-sky-100 text-sky-700 border border-sky-200",
        HIGH: "bg-violet-100 text-violet-700 border border-violet-200",
        URGENT: "bg-rose-100 text-rose-700 border border-rose-200",
    };
    return map[priority];
}

function getEventFallbackText(ev: TicketTimelineEvent) {
    const payload = (ev.payload || {}) as Record<string, unknown>;

    switch (ev.type) {
        case "TICKET_CREATED":
            return ev.message || "Se creó el ticket";

        case "STATUS_CHANGED": {
            const from = String(payload?.from || "");
            const to = String(payload?.to || "");

            if (from && to) {
                return `Estado: ${formatStatusLabel(from as TicketStatus)} → ${formatStatusLabel(to as TicketStatus)}`;
            }
            return to
                ? `Estado actualizado a ${formatStatusLabel(to as TicketStatus)}`
                : ev.message || "Estado actualizado";
        }

        case "PRIORITY_CHANGED": {
            const from = String(payload?.from || "");
            const to = String(payload?.to || "");

            if (from && to) {
                return `Prioridad: ${formatPriorityLabel(from as TicketPriority)} → ${formatPriorityLabel(to as TicketPriority)}`;
            }
            return to
                ? `Prioridad actualizada a ${formatPriorityLabel(to as TicketPriority)}`
                : ev.message || "Prioridad actualizada";
        }

        case "COMMENT_CREATED": {
            if (ev.message) return ev.message;
            const msg = payload?.message;
            return typeof msg === "string" && msg ? msg : "Comentario agregado";
        }

        case "ATTACHMENT_ADDED": {
            const name = payload?.originalName;
            return name
                ? `Se adjuntó archivo: ${name}`
                : ev.message || "Se adjuntó un archivo";
        }

        case "ATTACHMENT_DELETED": {
            const name = payload?.originalName;
            return name
                ? `Se eliminó archivo: ${name}`
                : ev.message || "Se eliminó un archivo";
        }

        case "TICKET_CLOSED":
            return ev.message || "El ticket fue cerrado";

        case "DETAILS_UPDATED": {
            const changes = payload?.changes as
                | Record<string, { before?: string | null; after?: string | null }>
                | undefined;

            if (!changes) return "Detalles actualizados";

            const parts: string[] = [];

            if (changes.title) {
                const before = changes.title.before ?? "—";
                const after = changes.title.after ?? "—";
                parts.push(`Título: ${before} → ${after}`);
            }

            if (changes.category) {
                const before = changes.category.before ?? "—";
                const after = changes.category.after ?? "—";
                parts.push(`Categoría: ${before} → ${after}`);
            }

            if (changes.description) {
                parts.push("Descripción actualizada");
            }

            return parts.length > 0 ? parts.join(" · ") : "Detalles actualizados";
        }

        default:
            return ev.message || "Evento registrado";
    }
}

function getEventTypeLabel(type: TicketTimelineEvent["type"]) {
    switch (type) {
        case "TICKET_CREATED":
            return "Ticket creado";
        case "STATUS_CHANGED":
            return "Estado actualizado";
        case "PRIORITY_CHANGED":
            return "Prioridad actualizada";
        case "COMMENT_CREATED":
            return "Comentario agregado";
        case "ATTACHMENT_ADDED":
            return "Adjunto agregado";
        case "ATTACHMENT_DELETED":
            return "Adjunto eliminado";
        case "TICKET_CLOSED":
            return "Ticket cerrado";
        case "DETAILS_UPDATED":
            return "Detalles editados";
        default:
            return "Evento";
    }
}

export default function TicketDetailPage() {
    const nav = useNavigate();
    const { ticketId } = useParams();
    const condoId = storage.getCondoId();
    const { showToast } = useToast();
    const {
        canManageTicketWorkflow,
        canEditTicketDetails,
        canCloseTickets,
        canDeleteTicketAttachments,
    } = useCondoAccess();

    const detailQ = useTicketDetail(condoId, ticketId || "");
    const timelineQ = useTicketTimeline(condoId, ticketId || "");
    const commentsQ = useCommentsList(condoId, ticketId || "");
    const attachmentsQ = useTicketAttachments(condoId, ticketId || "");

    const createComment = useCreateComment();
    const updateStatus = useUpdateTicketStatus();
    const updatePriority = useUpdateTicketPriority();
    const createAtt = useCreateTicketAttachment();
    const deleteAtt = useDeleteTicketAttachment();
    const updateDetails = useUpdateTicketDetails();

    const [draft, setDraft] = useState("");
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [busyAttachmentAction, setBusyAttachmentAction] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    const comments = useMemo(() => commentsQ.data ?? [], [commentsQ.data]);
    const attachments: TicketAttachment[] = useMemo(
        () => attachmentsQ.data ?? [],
        [attachmentsQ.data]
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments.length]);

    const timeline: TicketTimelineEvent[] = useMemo(() => {
        const raw = timelineQ.data;
        if (!raw) return [];
        if ("timeline" in raw && Array.isArray(raw.timeline)) {
            return raw.timeline;
        }
        // Fallbacks if backend momentarily returns an array directly
        if (Array.isArray(raw)) return raw as TicketTimelineEvent[];
        const obj = raw as Record<string, unknown>;
        if (obj.items && Array.isArray(obj.items)) return obj.items as TicketTimelineEvent[];
        return [];
    }, [timelineQ.data]);

    async function handleViewAttachment(attachment: TicketAttachment) {
        const key = `view-${attachment.id}`;

        try {
            setBusyAttachmentAction(key);
            await openTicketAttachmentInNewTab(condoId, ticketId || "", attachment.id);
        } catch (error) {
            showToast({
                type: "error",
                title: "No se pudo abrir el archivo",
                message:
                    error instanceof Error
                        ? error.message
                        : "Intenta nuevamente en unos momentos.",
            });
        } finally {
            setBusyAttachmentAction(null);
        }
    }

    async function handleDownloadAttachment(attachment: TicketAttachment) {
        const key = `download-${attachment.id}`;

        try {
            setBusyAttachmentAction(key);
            await downloadTicketAttachmentFile(
                condoId,
                ticketId || "",
                attachment.id,
                attachment.originalName
            );
        } catch (error) {
            showToast({
                type: "error",
                title: "No se pudo descargar el archivo",
                message:
                    error instanceof Error
                        ? error.message
                        : "Intenta nuevamente en unos momentos.",
            });
        } finally {
            setBusyAttachmentAction(null);
        }
    }

    async function handleDeleteAttachment(a: TicketAttachment) {
        try {
            setBusyAttachmentAction(`delete-${a.id}`);

            await deleteAtt.mutateAsync({
                condoId,
                ticketId: ticketId || "",
                attachmentId: a.id,
            });

            showToast({
                type: "success",
                title: "El archivo ha sido eliminado exitosamente",
            });
        } catch (error) {
            showToast({
                type: "error",
                title: "No se pudo eliminar el archivo",
                message:
                    error instanceof Error
                        ? error.message
                        : "Intenta nuevamente.",
            });
        } finally {
            setBusyAttachmentAction(null);
        }
    }

    return (
        <>
            <div className="mx-auto flex w-full max-w-7xl justify-end gap-2 px-6 pt-4">
                <button
                    onClick={() => nav(-1)}
                    className={cn(
                        "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                    )}
                >
                    Volver
                </button>
                <button
                    onClick={() => nav("/")}
                    className={cn(
                        "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                    )}
                >
                    Dashboard
                </button>
            </div>

            <div className="mx-auto w-full max-w-7xl px-6 py-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    {detailQ.isLoading ? (
                        <div className="space-y-3">
                            <div className="h-6 w-72 animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                        </div>
                    ) : detailQ.isError ? (
                        <div className="text-sm text-red-600">
                            No se pudo cargar el ticket.
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        {detailQ.data?.title}
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {detailQ.data?.description}
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {detailQ.data?.status && (
                                            <span
                                                className={cn(
                                                    "rounded-full px-3 py-1 text-xs font-semibold",
                                                    statusBadgeClass(detailQ.data.status)
                                                )}
                                            >
                                                {formatStatusLabel(detailQ.data.status)}
                                            </span>
                                        )}

                                        {detailQ.data?.priority && (
                                            <span
                                                className={cn(
                                                    "rounded-full px-3 py-1 text-xs font-semibold",
                                                    priorityBadgeClass(detailQ.data.priority)
                                                )}
                                            >
                                                Prioridad {formatPriorityLabel(detailQ.data.priority)}
                                            </span>
                                        )}

                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                            {detailQ.data?.category ?? "Sin categoría"}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                                        <span>
                                            ID:{" "}
                                            <span className="font-semibold text-slate-700">
                                                {ticketId}
                                            </span>
                                        </span>
                                        {detailQ.data?.createdAt && (
                                            <span>
                                                Creado:{" "}
                                                {new Date(detailQ.data.createdAt).toLocaleString()}
                                            </span>
                                        )}
                                        {detailQ.data?.updatedAt && (
                                            <span>
                                                Última actualización:{" "}
                                                {new Date(detailQ.data.updatedAt).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <select
                                        value={(detailQ.data?.status as TicketStatus) || "OPEN"}
                                        onChange={(e) => {
                                            if (!ticketId) return;
                                            updateStatus.mutate({
                                                condoId,
                                                ticketId,
                                                status: e.target.value as TicketStatus,
                                            });
                                        }}
                                        disabled={!canManageTicketWorkflow || updateStatus.isPending || detailQ.isLoading || detailQ.data?.status === "CLOSED"}
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                                    >
                                        <option value="OPEN">Abierto</option>
                                        <option value="IN_PROGRESS">En progreso</option>
                                        <option value="CLOSED">Cerrado</option>
                                    </select>

                                    <select
                                        value={
                                            (detailQ.data?.priority as TicketPriority) || "MEDIUM"
                                        }
                                        onChange={(e) => {
                                            if (!ticketId) return;
                                            updatePriority.mutate({
                                                condoId,
                                                ticketId,
                                                priority: e.target.value as TicketPriority,
                                            });
                                        }}
                                        disabled={!canManageTicketWorkflow || updatePriority.isPending || detailQ.isLoading || detailQ.data?.status === "CLOSED"}
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                                    >
                                        <option value="LOW">Baja</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="HIGH">Alta</option>
                                        <option value="URGENT">Urgente</option>
                                    </select>

                                    {canEditTicketDetails && detailQ.data?.status !== "CLOSED" && (
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                        >
                                            Editar ticket
                                        </button>
                                    )}

                                    {canCloseTickets && detailQ.data?.status !== "CLOSED" && (
                                        <button
                                            onClick={() => setIsCloseModalOpen(true)}
                                            className="rounded-xl bg-gradient-to-r from-red-500 to-rose-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-400 hover:to-rose-300 focus:outline-none focus:ring-4 focus:ring-red-100"
                                        >
                                            Cerrar ticket
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
                            {timelineQ.isFetching && (
                                <span className="text-xs text-slate-500">Actualizando…</span>
                            )}
                        </div>

                        {timelineQ.isLoading ? (
                            <div className="mt-4 space-y-3">
                                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                                <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
                                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                            </div>
                        ) : timelineQ.isError ? (
                            <div className="mt-3 text-sm text-red-600">
                                No se pudo cargar el timeline.
                            </div>
                        ) : timeline.length === 0 ? (
                            <div className="mt-3 text-sm text-slate-500">
                                Aún no hay eventos.
                            </div>
                        ) : (
                            <ol className="mt-4 space-y-4">
                                {timeline.map((ev, idx) => {
                                    const dt = ev.createdAt ? new Date(ev.createdAt) : null;
                                    const when = dt ? dt.toLocaleString() : "—";
                                    const text = getEventFallbackText(ev);

                                    return (
                                        <li key={ev.id ?? idx} className="flex gap-3">
                                            <div className="mt-1 flex flex-col items-center">
                                                <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                                                <div className="mt-1 h-full w-px bg-slate-200" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                        {getEventTypeLabel(ev.type)}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {when}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        por {ev.actor?.name || ev.actor?.email || "Sistema"}
                                                    </span>
                                                </div>

                                                <div className="mt-1 text-sm text-slate-700">
                                                    {text}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>

                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Adjuntos
                                </h3>
                                {attachmentsQ.isFetching && !attachmentsQ.isLoading && (
                                    <span className="text-xs text-slate-500">
                                        Actualizando…
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Sube imágenes, PDFs o documentos relacionados con este ticket.
                            </p>
                        </div>

                        <div className="px-6 py-5">
                            <AttachmentCreateForm
                                disabled={createAtt.isPending}
                                onSubmit={(payload) =>
                                    createAtt.mutate({
                                        condoId,
                                        ticketId: ticketId || "",
                                        file: payload.file,
                                    })
                                }
                                error={
                                    createAtt.isError
                                        ? "No se pudo subir el adjunto. Intenta de nuevo."
                                        : null
                                }
                            />

                            <div className="mt-5">
                                {attachmentsQ.isLoading ? (
                                    <div className="space-y-2">
                                        <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                                        <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                                    </div>
                                ) : attachmentsQ.isError ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        Error cargando adjuntos.
                                    </div>
                                ) : attachments.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                                        Aún no hay adjuntos en este ticket.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                                        {attachments.map((a) => {
                                            const isViewing =
                                                busyAttachmentAction === `view-${a.id}`;
                                            const isDownloading =
                                                busyAttachmentAction === `download-${a.id}`;
                                            const isBusy = isViewing || isDownloading;

                                            return (
                                                <div
                                                    key={a.id}
                                                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-slate-900">
                                                            {a.originalName}
                                                        </div>
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                            <span>{formatBytes(a.sizeBytes)}</span>
                                                            {a.createdAt && (
                                                                <span>
                                                                    •{" "}
                                                                    {new Date(
                                                                        a.createdAt
                                                                    ).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => handleViewAttachment(a)}
                                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                                        >
                                                            {isViewing ? "Abriendo…" : "Ver"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={isBusy}
                                                            onClick={() => handleDownloadAttachment(a)}
                                                            className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 disabled:opacity-60"
                                                        >
                                                            {isDownloading ? "Descargando…" : "Descargar"}
                                                        </button>

                                                        {canDeleteTicketAttachments && (
                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() => handleDeleteAttachment(a)}
                                                                className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-400 disabled:opacity-60"
                                                            >
                                                                {busyAttachmentAction === `delete-${a.id}` ? "Eliminando…" : "Eliminar"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Comentarios
                                </h3>
                                {commentsQ.isFetching && !commentsQ.isLoading && (
                                    <span className="text-xs text-slate-500">
                                        Actualizando…
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Deja registro de avances para el comité y residentes.
                            </p>
                        </div>

                        <div className="px-6 py-5">
                            <div className="max-h-[340px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                {commentsQ.isLoading ? (
                                    <div className="space-y-3">
                                        <div className="h-10 animate-pulse rounded-2xl bg-white" />
                                        <div className="h-10 animate-pulse rounded-2xl bg-white" />
                                        <div className="h-10 animate-pulse rounded-2xl bg-white" />
                                    </div>
                                ) : commentsQ.isError ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        Error cargando comentarios.
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
                                        Aún no hay comentarios.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {comments.map((c: CommentItem) => (
                                            <div
                                                key={c.id}
                                                className="rounded-2xl border border-slate-200 bg-white p-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-xs font-semibold text-slate-700">
                                                        {c.authorName ?? "Usuario"}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {new Date(
                                                            c.createdAt
                                                        ).toLocaleString()}
                                                    </div>
                                                </div>

                                                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-900">
                                                    {c.message}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={bottomRef} />
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                {createComment.isError && (
                                    <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        No se pudo enviar el comentario. Intenta de nuevo.
                                    </div>
                                )}

                                <label className="mb-1 block text-xs font-semibold text-slate-600">
                                    Escribe un comentario
                                </label>

                                <textarea
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    placeholder="Ej: Se coordinó visita técnica para mañana 10:00…"
                                    rows={3}
                                    disabled={createComment.isPending}
                                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            const msg = draft.trim();
                                            if (!msg) return;

                                            createComment.mutate(
                                                {
                                                    condoId,
                                                    ticketId: ticketId || "",
                                                    message: msg,
                                                },
                                                {
                                                    onSuccess: () => setDraft(""),
                                                }
                                            );
                                        }
                                    }}
                                />

                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="text-xs text-slate-500">
                                        Enter para enviar · Shift+Enter para nueva línea
                                    </p>

                                    <button
                                        type="button"
                                        disabled={
                                            createComment.isPending || !draft.trim()
                                        }
                                        className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                                        onClick={() => {
                                            const msg = draft.trim();
                                            if (!msg) return;

                                            createComment.mutate(
                                                {
                                                    condoId,
                                                    ticketId: ticketId || "",
                                                    message: msg,
                                                },
                                                { onSuccess: () => setDraft("") }
                                            );
                                        }}
                                    >
                                        {createComment.isPending
                                            ? "Enviando…"
                                            : "Comentar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <CloseTicketModal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                onConfirm={() => {
                    if (!ticketId) return;
                    updateStatus.mutate(
                        { condoId, ticketId, status: "CLOSED" },
                        {
                            onSuccess: () => setIsCloseModalOpen(false),
                        }
                    );
                }}
                isPending={updateStatus.isPending}
            />

            <EditTicketModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                initialTitle={detailQ.data?.title ?? ""}
                initialDescription={detailQ.data?.description ?? ""}
                initialCategory={detailQ.data?.category ?? ""}
                isPending={updateDetails.isPending}
                onSave={(values) => {
                    if (!ticketId) return;
                    updateDetails.mutate(
                        {
                            condoId,
                            ticketId,
                            ...values,
                        },
                        {
                            onSuccess: () => {
                                setIsEditModalOpen(false);
                                showToast({
                                    type: "success",
                                    title: "Ticket actualizado correctamente",
                                });
                            },
                            onError: (error) => {
                                showToast({
                                    type: "error",
                                    title: "No se pudo actualizar el ticket",
                                    message:
                                        error instanceof Error
                                            ? error.message
                                            : "Intenta nuevamente.",
                                });
                            },
                        }
                    );
                }}
            />
        </>
    );
}

function AttachmentCreateForm({
    disabled,
    onSubmit,
    error,
}: {
    disabled?: boolean;
    onSubmit: (payload: { file: File }) => void;
    error?: string | null;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [localErr, setLocalErr] = useState<string | null>(null);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                        Seleccionar archivo
                    </label>
                    <input
                        id="ticket-file-input"
                        type="file"
                        onChange={(e) => {
                            setFile(e.target.files?.[0] ?? null);
                            setLocalErr(null);
                        }}
                        disabled={disabled}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls, .xlsx"
                    />
                </div>

                <div className="shrink-0">
                    <button
                        type="button"
                        disabled={disabled || !file}
                        className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:opacity-60 sm:w-auto"
                        onClick={() => {
                            if (!file) {
                                return setLocalErr("Selecciona un archivo primero.");
                            }

                            if (file.size > 10 * 1024 * 1024) {
                                return setLocalErr(
                                    "El archivo no puede pesar más de 10 MB."
                                );
                            }

                            onSubmit({ file });
                            setFile(null);
                            setLocalErr(null);

                            const input = document.getElementById(
                                "ticket-file-input"
                            ) as HTMLInputElement | null;

                            if (input) input.value = "";
                        }}
                    >
                        Subir adjunto
                    </button>
                </div>
            </div>

            {(localErr || error) && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {localErr || error}
                </div>
            )}
        </div>
    );
}

function CloseTicketModal({
    isOpen,
    onClose,
    onConfirm,
    isPending,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isPending: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-slate-900">
                    Cerrar ticket
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                    ¿Confirmas que deseas cerrar este ticket?
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="rounded-xl bg-gradient-to-r from-red-500 to-rose-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-red-400 hover:to-rose-300 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
                    >
                        {isPending ? "Cerrando…" : "Confirmar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const CATEGORIES = ["MANTENCIÓN", "SEGURIDAD", "ASEO", "ADMINISTRACIÓN", "OTROS"] as const;

function EditTicketModal({
    isOpen,
    onClose,
    initialTitle,
    initialDescription,
    initialCategory,
    isPending,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    initialTitle: string;
    initialDescription: string;
    initialCategory: string;
    isPending: boolean;
    onSave: (values: { title: string; description: string; category: string }) => void;
}) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [category, setCategory] = useState(initialCategory);

    // Sync form when modal opens with fresh data
    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setDescription(initialDescription);
            setCategory(initialCategory);
        }
    }, [isOpen, initialTitle, initialDescription, initialCategory]);

    if (!isOpen) return null;

    const titleOk = title.trim().length >= 4;
    const descOk = description.trim().length >= 10;
    const canSave = titleOk && descOk && !isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-slate-900">
                    Editar ticket
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    Modifica título, descripción o categoría.
                </p>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Título
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isPending}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                        />
                        {title.length > 0 && !titleOk && (
                            <p className="mt-1 text-xs text-red-600">Mínimo 4 caracteres.</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            disabled={isPending}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                        />
                        {description.length > 0 && !descOk && (
                            <p className="mt-1 text-xs text-red-600">Mínimo 10 caracteres.</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                            Categoría
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={isPending}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() =>
                            onSave({
                                title: title.trim(),
                                description: description.trim(),
                                category,
                            })
                        }
                        disabled={!canSave}
                        className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:opacity-50"
                    >
                        {isPending ? "Guardando…" : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}