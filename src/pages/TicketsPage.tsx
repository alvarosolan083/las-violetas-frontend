import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { storage } from "../lib/storage";
import { useTicketsList } from "../features/tickets/tickets.hooks";
import type { TicketPriority, TicketStatus, TicketItem } from "../features/tickets/tickets.api";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

const STATUS_OPTIONS: Array<{ label: string; value: TicketStatus | "" }> = [
    { label: "Todos", value: "" },
    { label: "Abiertos", value: "OPEN" },
    { label: "En progreso", value: "IN_PROGRESS" },
    { label: "Cerrados", value: "CLOSED" },
];

const PRIORITY_OPTIONS: Array<{ label: string; value: TicketPriority | "" }> = [
    { label: "Todas", value: "" },
    { label: "Low", value: "LOW" },
    { label: "Medium", value: "MEDIUM" },
    { label: "High", value: "HIGH" },
    { label: "Urgent", value: "URGENT" },
];

export default function TicketsPage() {
    const nav = useNavigate();
    const condoId = storage.getCondoId();

    const [sp, setSp] = useSearchParams();

    // Estado desde URL (para que sea compartible / back button friendly)
    const page = Math.max(1, Number(sp.get("page") || 1));
    const pageSize = Math.min(50, Math.max(5, Number(sp.get("pageSize") || 10)));

    const status = (sp.get("status") || "") as TicketStatus | "";
    const priority = (sp.get("priority") || "") as TicketPriority | "";
    const q = sp.get("q") || "";

    const [qInput, setQInput] = useState(q);

    const listQ = useTicketsList({
        condoId,
        page,
        pageSize,
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(q ? { search: q } : {}),
    });

    const items: TicketItem[] = listQ.data?.items ?? [];
    const total = listQ.data?.total ?? 0;
    const totalPages = listQ.data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

    const showing = useMemo(() => {
        const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
        const to = Math.min(total, page * pageSize);
        return { from, to };
    }, [page, pageSize, total]);

    function setParam(next: Record<string, string | number | null | undefined>) {
        const n = new URLSearchParams(sp);
        Object.entries(next).forEach(([k, v]) => {
            if (v === null || v === undefined || v === "") n.delete(k);
            else n.set(k, String(v));
        });
        // cuando cambias filtros, resetea page a 1
        if ("status" in next || "priority" in next || "q" in next || "pageSize" in next) {
            n.set("page", "1");
        }
        setSp(n, { replace: true });
    }

    function badgeStatus(s: TicketStatus) {
        switch (s) {
            case "OPEN":
                return "bg-red-100 text-red-700";
            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-700";
            case "CLOSED":
                return "bg-green-100 text-green-700";
        }
    }

    function badgePriority(p?: TicketPriority) {
        switch (p) {
            case "URGENT":
                return "bg-slate-900 text-white";
            case "HIGH":
                return "bg-purple-100 text-purple-700";
            case "MEDIUM":
                return "bg-sky-100 text-sky-700";
            case "LOW":
                return "bg-slate-100 text-slate-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    }

    return (
        <AppShell
            title="Las Violetas"
            subtitle="Tickets"
            right={
                <button
                    onClick={() => nav("/tickets/new")}
                    className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                    Crear ticket
                </button>
            }
        >
            {/* Filtros */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Tickets</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Administra solicitudes con filtros y paginación.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Estado</label>
                            <select
                                value={status}
                                onChange={(e) => setParam({ status: e.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-sky-100"
                            >
                                {STATUS_OPTIONS.map((o) => (
                                    <option key={o.label} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Prioridad</label>
                            <select
                                value={priority}
                                onChange={(e) => setParam({ priority: e.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-sky-100"
                            >
                                {PRIORITY_OPTIONS.map((o) => (
                                    <option key={o.label} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Buscar</label>
                            <div className="flex gap-2">
                                <input
                                    value={qInput}
                                    onChange={(e) => setQInput(e.target.value)}
                                    placeholder="Título, categoría…"
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-sky-100"
                                />
                                <button
                                    onClick={() => setParam({ q: qInput.trim() })}
                                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200"
                                >
                                    Buscar
                                </button>
                                <button
                                    onClick={() => {
                                        setQInput("");
                                        setParam({ q: "", status: "", priority: "" });
                                    }}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                        {listQ.isLoading ? "Cargando…" : `Mostrando ${showing.from}-${showing.to} de ${total}`}
                        {listQ.isFetching && !listQ.isLoading ? " · Actualizando…" : ""}
                    </p>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Por página</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setParam({ pageSize: Number(e.target.value) })}
                            className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-slate-100"
                        >
                            {[10, 15, 20, 30].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">Listado</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-6 py-3 text-left">ID</th>
                                <th className="px-6 py-3 text-left">Título</th>
                                <th className="px-6 py-3 text-left">Estado</th>
                                <th className="px-6 py-3 text-left">Prioridad</th>
                                <th className="px-6 py-3 text-left">Fecha</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {listQ.isLoading ? (
                                <>
                                    <RowSkeleton />
                                    <RowSkeleton />
                                    <RowSkeleton />
                                    <RowSkeleton />
                                </>
                            ) : listQ.isError ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-red-600">
                                        Error cargando tickets. Revisa auth/condoId.
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                                        No hay tickets con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                items.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => nav(`/tickets/${t.id}`)}
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-900">{t.id.slice(0, 8)}…</td>
                                        <td className="px-6 py-4 text-slate-900">{t.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", badgeStatus(t.status))}>
                                                {t.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", badgePriority(t.priority))}>
                                                {t.priority ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        disabled={page <= 1}
                        onClick={() => setParam({ page: page - 1 })}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Anterior
                    </button>

                    <div className="text-xs text-slate-500">
                        Página <span className="font-semibold text-slate-700">{page}</span> de{" "}
                        <span className="font-semibold text-slate-700">{totalPages}</span>
                    </div>

                    <button
                        disabled={page >= totalPages}
                        onClick={() => setParam({ page: page + 1 })}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </AppShell>
    );
}

/* ---------- UI helpers ---------- */

function RowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4">
                <div className="h-3 w-20 rounded bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="h-3 w-64 rounded bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="h-6 w-24 rounded-full bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="h-6 w-24 rounded-full bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="h-3 w-24 rounded bg-slate-100" />
            </td>
        </tr>
    );
}