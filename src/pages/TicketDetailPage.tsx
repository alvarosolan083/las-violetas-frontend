import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { storage } from "../lib/storage";
import { cn } from "../lib/cn";
import { useTicketDetail, useTicketTimeline } from "../features/tickets/tickets.hooks";
import { useCommentsList } from "../features/comments/comments.hooks";
import { useCreateComment } from "../features/comments/comments.mutations";
import type { CommentItem } from "../features/comments/comments.api";
import { useUpdateTicketStatus, useUpdateTicketPriority, useCreateTicketAttachment } from "../features/tickets/tickets.mutations";
import { useTicketAttachments } from "../features/tickets/tickets.hooks";
import type { TicketStatus, TicketPriority, TicketAttachment } from "../features/tickets/tickets.api";




type TimelineEvent = {
    id?: string;
    type?: string;
    createdAt?: string;
    message?: string;
    payload?: unknown;
    actor?: { name?: string; email?: string };
};

export default function TicketDetailPage() {
    const nav = useNavigate();
    const { ticketId } = useParams();
    const condoId = storage.getCondoId();

    const detailQ = useTicketDetail(condoId, ticketId || "");
    const timelineQ = useTicketTimeline(condoId, ticketId || "");
    const commentsQ = useCommentsList(condoId, ticketId || "");
    const createComment = useCreateComment();
    const updateStatus = useUpdateTicketStatus();
    const updatePriority = useUpdateTicketPriority();
    const attachmentsQ = useTicketAttachments(condoId, ticketId || "");
    const createAtt = useCreateTicketAttachment();

    const [draft, setDraft] = useState("");
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const comments = useMemo(() => commentsQ.data ?? [], [commentsQ.data]);

    useEffect(() => {
        // auto-scroll cuando llegan comentarios
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments.length]);

    const timeline: TimelineEvent[] = useMemo(() => {
        const raw = timelineQ.data;
        if (Array.isArray(raw)) return raw;
        if (raw?.items && Array.isArray(raw.items)) return raw.items;
        return [];
    }, [timelineQ.data]);

    return (
        <AppShell
            title="Las Violetas"
            subtitle="Detalle ticket"
            right={
                <>
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
                </>
            }
        >
            {/* Header del ticket */}
            <div className="mx-auto w-full max-w-7xl px-6 py-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    {detailQ.isLoading ? (
                        <div className="space-y-3">
                            <div className="h-6 w-72 animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                        </div>
                    ) : detailQ.isError ? (
                        <div className="text-sm text-red-600">No se pudo cargar el ticket.</div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{detailQ.data?.title}</h2>
                                    <p className="mt-2 text-sm text-slate-600">{detailQ.data?.description}</p>
                                    <p className="mt-3 text-xs text-slate-400">
                                        ID: <span className="font-semibold text-slate-600">{ticketId}</span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {/* STATUS */}
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
                                        disabled={updateStatus.isPending || detailQ.isLoading}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                                    >
                                        <option value="OPEN">OPEN</option>
                                        <option value="IN_PROGRESS">IN PROGRESS</option>
                                        <option value="CLOSED">CLOSED</option>
                                    </select>

                                    {/* PRIORITY */}
                                    <select
                                        value={(detailQ.data?.priority as TicketPriority) || "MEDIUM"}
                                        onChange={(e) => {
                                            if (!ticketId) return;
                                            updatePriority.mutate({
                                                condoId,
                                                ticketId,
                                                priority: e.target.value as TicketPriority,
                                            });
                                        }}
                                        disabled={updatePriority.isPending || detailQ.isLoading}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                                    >
                                        <option value="LOW">LOW</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HIGH">HIGH</option>
                                        <option value="URGENT">URGENT</option>
                                    </select>

                                    {/* CATEGORY (solo lectura por ahora) */}
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {detailQ.data?.category ?? "—"}
                                    </span>

                                    {/* CLOSE BUTTON */}
                                    {detailQ.data?.status !== "CLOSED" && (
                                        <button
                                            onClick={() => setIsCloseModalOpen(true)}
                                            className="rounded-xl bg-gradient-to-r from-red-500 to-rose-400 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:from-red-400 hover:to-rose-300 focus:outline-none focus:ring-4 focus:ring-red-100"
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
                    {/* Timeline */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
                            {timelineQ.isFetching && <span className="text-xs text-slate-500">Actualizando…</span>}
                        </div>

                        {timelineQ.isLoading ? (
                            <div className="mt-4 space-y-3">
                                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                                <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
                                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                            </div>
                        ) : timelineQ.isError ? (
                            <div className="mt-3 text-sm text-red-600">No se pudo cargar el timeline.</div>
                        ) : timeline.length === 0 ? (
                            <div className="mt-3 text-sm text-slate-500">Aún no hay eventos.</div>
                        ) : (
                            <ol className="mt-4 space-y-4">
                                {timeline.map((ev, idx) => {
                                    const dt = ev.createdAt ? new Date(ev.createdAt) : null;
                                    const when = dt ? dt.toLocaleString() : "—";
                                    const type = (ev.type ?? "EVENT").toString();

                                    return (
                                        <li key={ev.id ?? idx} className="flex gap-3">
                                            <div className="mt-1 flex flex-col items-center">
                                                <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                                                <div className="mt-1 h-full w-px bg-slate-200" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                        {type.replaceAll("_", " ")}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{when}</span>
                                                </div>

                                                <div className="mt-1 text-sm text-slate-700">
                                                    {ev.message ||
                                                        (typeof ev.payload === "string" ? ev.payload : null) ||
                                                        "Evento registrado"}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>

                    {/* Adjuntos */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-slate-900">Adjuntos</h3>
                                {attachmentsQ.isFetching && !attachmentsQ.isLoading && (
                                    <span className="text-xs text-slate-500">Actualizando…</span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Agrega links a fotos o documentos (Drive, S3, etc.). Más adelante lo haremos “subir archivo”.
                            </p>
                        </div>

                        <div className="px-6 py-5">
                            <AttachmentCreateForm
                                disabled={createAtt.isPending}
                                onSubmit={(payload) => createAtt.mutate({ condoId, ticketId: ticketId || "", ...payload })}
                                error={createAtt.isError ? "No se pudo agregar el adjunto. Revisa el link." : null}
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
                                ) : (attachmentsQ.data?.length ?? 0) === 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                                        Aún no hay adjuntos en este ticket.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                                        {(attachmentsQ.data as TicketAttachment[]).map((a) => (
                                            <div
                                                key={a.id}
                                                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-slate-900">{a.filename}</div>
                                                    <div className="truncate text-xs text-slate-500">{a.url}</div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    <a
                                                        href={a.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        Abrir
                                                    </a>

                                                    <button
                                                        type="button"
                                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        onClick={async () => {
                                                            try {
                                                                await navigator.clipboard.writeText(a.url);
                                                            } catch {
                                                                // nada (si el browser bloquea clipboard)
                                                            }
                                                        }}
                                                    >
                                                        Copiar link
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Comentarios */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-slate-900">Comentarios</h3>
                                {commentsQ.isFetching && !commentsQ.isLoading && (
                                    <span className="text-xs text-slate-500">Actualizando…</span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Deja registro de avances para el comité y residentes.
                            </p>
                        </div>

                        <div className="px-6 py-5">
                            {/* Lista */}
                            <div className="max-h-[340px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                {commentsQ.isLoading ? (
                                    <div className="space-y-3">
                                        <div className="h-10 rounded-2xl bg-white animate-pulse" />
                                        <div className="h-10 rounded-2xl bg-white animate-pulse" />
                                        <div className="h-10 rounded-2xl bg-white animate-pulse" />
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
                                        {(comments as CommentItem[]).map((c) => (
                                            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-xs font-semibold text-slate-700">
                                                        {c.authorName ?? "Usuario"}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {new Date(c.createdAt).toLocaleString()}
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

                            {/* Composer */}
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
                                        // Enter = enviar, Shift+Enter = salto de línea
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            const msg = draft.trim();
                                            if (!msg) return;

                                            createComment.mutate(
                                                { condoId, ticketId: ticketId || "", message: msg },
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
                                        disabled={createComment.isPending || !draft.trim()}
                                        className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                                        onClick={() => {
                                            const msg = draft.trim();
                                            if (!msg) return;

                                            createComment.mutate(
                                                { condoId, ticketId: ticketId || "", message: msg },
                                                { onSuccess: () => setDraft("") }
                                            );
                                        }}
                                    >
                                        {createComment.isPending ? "Enviando…" : "Comentar"}
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
        </AppShell>
    );
}

function AttachmentCreateForm({
    disabled,
    onSubmit,
    error,
}: {
    disabled?: boolean;
    onSubmit: (payload: { url: string; filename: string }) => void;
    error?: string | null;
}) {
    const [url, setUrl] = useState("");
    const [filename, setFilename] = useState("");
    const [localErr, setLocalErr] = useState<string | null>(null);

    function guessFilenameFromUrl(u: string) {
        try {
            const parsed = new URL(u);
            const last = parsed.pathname.split("/").filter(Boolean).pop() || "";
            return decodeURIComponent(last) || "adjunto";
        } catch {
            return "";
        }
    }

    function isValidUrl(u: string) {
        try {
            const parsed = new URL(u);
            return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
            return false;
        }
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">URL</label>
                    <input
                        value={url}
                        onChange={(e) => {
                            const v = e.target.value;
                            setUrl(v);
                            setLocalErr(null);
                            // autocompleta filename si está vacío
                            if (!filename.trim()) setFilename(guessFilenameFromUrl(v));
                        }}
                        placeholder="https://example.com/foto-porton.jpg"
                        disabled={disabled}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
                    <input
                        value={filename}
                        onChange={(e) => {
                            setFilename(e.target.value);
                            setLocalErr(null);
                        }}
                        placeholder="foto-porton.jpg"
                        disabled={disabled}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                    />
                </div>
            </div>

            {(localErr || error) && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {localErr || error}
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                    Tip: usa links públicos o con permisos del comité.
                </p>

                <button
                    type="button"
                    disabled={disabled}
                    className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:opacity-60"
                    onClick={() => {
                        const u = url.trim();
                        const f = filename.trim() || guessFilenameFromUrl(u);

                        if (!u) return setLocalErr("Ingresa una URL.");
                        if (!isValidUrl(u)) return setLocalErr("La URL no es válida (usa http/https).");
                        if (!f) return setLocalErr("Ingresa un nombre para el archivo.");

                        onSubmit({ url: u, filename: f });
                        setUrl("");
                        setFilename("");
                        setLocalErr(null);
                    }}
                >
                    Agregar adjunto
                </button>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-slate-900">Cerrar ticket</h3>
                <p className="mt-2 text-sm text-slate-600">¿Confirmas que deseas cerrar este ticket?</p>

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
