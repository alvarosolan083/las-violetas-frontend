import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storage } from "../lib/storage";
import { useTicketsList } from "../features/tickets/tickets.hooks";
import type {
    TicketStatus,
    TicketPriority,
    TicketItem,
} from "../features/tickets/tickets.api";
import { useLatestAnnouncements } from "../features/announcements/announcements.hooks";
import { useCondoAccess } from "../features/auth/useCondoAccess";

function formatStatusLabel(s: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
        OPEN: "Abierto",
        IN_PROGRESS: "En progreso",
        CLOSED: "Cerrado",
    };
    return map[s];
}

function formatPriorityLabel(p: TicketPriority): string {
    const map: Record<TicketPriority, string> = {
        LOW: "Baja",
        MEDIUM: "Media",
        HIGH: "Alta",
        URGENT: "Urgente",
    };
    return map[p];
}

export default function DashboardPage() {
    const nav = useNavigate();

    const condoId = storage.getCondoId();
    const { canManageDocuments } = useCondoAccess();

    const { data: latestAnnouncements, isLoading: isLoadingAnnouncements } =
        useLatestAnnouncements(3);

    const listQuery = useTicketsList({
        condoId,
        page: 1,
        pageSize: 8,
    });

    const totalQ = useTicketsList({ condoId, page: 1, pageSize: 1 });
    const openQ = useTicketsList({ condoId, page: 1, pageSize: 1, status: "OPEN" });
    const progQ = useTicketsList({
        condoId,
        page: 1,
        pageSize: 1,
        status: "IN_PROGRESS",
    });
    const closedQ = useTicketsList({
        condoId,
        page: 1,
        pageSize: 1,
        status: "CLOSED",
    });

    const stats = useMemo(() => {
        return {
            total: totalQ.data?.total ?? 0,
            open: openQ.data?.total ?? 0,
            inProgress: progQ.data?.total ?? 0,
            closed: closedQ.data?.total ?? 0,
        };
    }, [
        totalQ.data?.total,
        openQ.data?.total,
        progQ.data?.total,
        closedQ.data?.total,
    ]);



    function badgeStatus(status: TicketStatus) {
        switch (status) {
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
            case "HIGH":
                return "bg-purple-100 text-purple-700";
            case "MEDIUM":
                return "bg-sky-100 text-sky-700";
            case "LOW":
                return "bg-slate-100 text-slate-700";
            case "URGENT":
                return "bg-rose-100 text-rose-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    }

    const tickets: TicketItem[] = listQuery.data?.items ?? [];

    const loadingAny =
        totalQ.isLoading || openQ.isLoading || progQ.isLoading || closedQ.isLoading;

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Panel de gestión
                        </h2>

                        <p className="mt-1 text-sm text-slate-600">
                            Gestiona solicitudes, revisa anuncios, documentos y reserva espacios comunes.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => nav("/tickets/new")}
                            className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
                        >
                            Crear ticket
                        </button>

                        <button
                            onClick={() => nav("/tickets")}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                        >
                            Ver tickets
                        </button>

                        <button
                            onClick={() => nav("/reservations")}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                        >
                            Espacios comunes
                        </button>

                        <button
                            onClick={() => nav("/documents")}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                        >
                            Documentos
                        </button>

                        {canManageDocuments && (
                            <button
                                onClick={() => nav("/documents/admin")}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                            >
                                Gestión documentos
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total tickets" value={stats.total} color="slate" loading={loadingAny} />
                <StatCard title="Abiertos" value={stats.open} color="red" loading={loadingAny} />
                <StatCard title="En progreso" value={stats.inProgress} color="yellow" loading={loadingAny} />
                <StatCard title="Cerrados" value={stats.closed} color="green" loading={loadingAny} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Últimos tickets
                                </h3>

                                {listQuery.isFetching && (
                                    <span className="text-xs text-slate-500">
                                        Actualizando…
                                    </span>
                                )}
                            </div>
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
                                    {listQuery.isLoading ? (
                                        <>
                                            <RowSkeleton />
                                            <RowSkeleton />
                                            <RowSkeleton />
                                        </>
                                    ) : (
                                        tickets.map((t) => (
                                            <tr
                                                key={t.id}
                                                className="cursor-pointer hover:bg-slate-50"
                                                onClick={() => nav(`/tickets/${t.id}`)}
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-900">
                                                    {t.id.slice(0, 8)}…
                                                </td>

                                                <td className="px-6 py-4 text-slate-900">
                                                    {t.title}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStatus(t.status)}`}>
                                                        {formatStatusLabel(t.status)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgePriority(t.priority)}`}>
                                                        {t.priority ? formatPriorityLabel(t.priority) : "—"}
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

                            {!listQuery.isLoading && !listQuery.isError && tickets.length === 0 && (
                                <div className="px-6 py-10 text-center text-sm text-slate-500">
                                    No hay tickets registrados.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Últimos anuncios
                                </h3>

                                <Link
                                    to="/announcements"
                                    className="text-xs font-medium text-sky-700 hover:underline"
                                >
                                    Ver todos
                                </Link>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {isLoadingAnnouncements ? (
                                <>
                                    <AnnouncementSkeleton />
                                    <AnnouncementSkeleton />
                                    <AnnouncementSkeleton />
                                </>
                            ) : latestAnnouncements?.items?.length ? (
                                latestAnnouncements.items.map((a) => (
                                    <div key={a.id} className="px-6 py-4">
                                        <div className="text-sm font-semibold text-slate-900">
                                            {a.title}
                                        </div>

                                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                                            {a.body}
                                        </p>

                                        <div className="mt-2 text-xs text-slate-500">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-center text-sm text-slate-500">
                                    No hay anuncios aún.
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-200 px-6 py-4">
                            <button
                                onClick={() => nav("/announcements")}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                            >
                                Ir al muro de anuncios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4"><div className="h-3 w-20 rounded bg-slate-100" /></td>
            <td className="px-6 py-4"><div className="h-3 w-64 rounded bg-slate-100" /></td>
            <td className="px-6 py-4"><div className="h-6 w-24 rounded-full bg-slate-100" /></td>
            <td className="px-6 py-4"><div className="h-6 w-24 rounded-full bg-slate-100" /></td>
            <td className="px-6 py-4"><div className="h-3 w-24 rounded bg-slate-100" /></td>
        </tr>
    );
}

function AnnouncementSkeleton() {
    return (
        <div className="animate-pulse px-6 py-4">
            <div className="h-3 w-40 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
        </div>
    );
}

function StatCard({
    title,
    value,
    color = "slate",
    loading,
}: {
    title: string;
    value: number;
    color?: "red" | "yellow" | "green" | "slate";
    loading?: boolean;
}) {
    const colorMap: Record<string, string> = {
        red: "from-red-500 to-red-400",
        yellow: "from-yellow-500 to-yellow-400",
        green: "from-green-500 to-green-400",
        slate: "from-slate-700 to-slate-600",
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colorMap[color]}`} />
            <p className="text-xs text-slate-500">{title}</p>

            {loading ? (
                <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-100" />
            ) : (
                <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            )}
        </div>
    );
}