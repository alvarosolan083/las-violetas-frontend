import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Link } from "react-router-dom";
import {
    useCommonSpaces,
    usePendingReservationsCount,
    useReservationsAdmin,
} from "../features/reservations/reservations.hooks";
import {
    useApproveReservation,
    useRejectReservation,
} from "../features/reservations/reservations.mutations";
import type {
    ReservationAdminItem,
    ReservationStatus,
} from "../features/reservations/reservations.api";
import { useToast } from "../hooks/useToast";
import { ConfirmActionModal } from "../components/ui/ConfirmActionModal";

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

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function normalizeText(value?: string | null) {
    return (value ?? "").toLowerCase().trim();
}

type QuickTab = "PENDING" | "ALL";

export default function ReservationsAdminPage() {
    const { showToast } = useToast();

    const [quickTab, setQuickTab] = useState<QuickTab>("PENDING");
    const [status, setStatus] = useState<ReservationStatus | "">("PENDING");
    const [spaceId, setSpaceId] = useState("");
    const [date, setDate] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        action: "APPROVE" | "REJECT";
        reservation: ReservationAdminItem | null;
    }>({
        isOpen: false,
        action: "APPROVE",
        reservation: null,
    });

    const spacesQuery = useCommonSpaces();
    const spaces = spacesQuery.data?.items ?? [];

    const adminQuery = useReservationsAdmin({
        status,
        spaceId,
        date,
        page,
        pageSize: 10,
    });

    const approveMutation = useApproveReservation();
    const rejectMutation = useRejectReservation();

    const pendingCountQuery = usePendingReservationsCount();
    const globalPendingCount = pendingCountQuery.data ?? 0;

    const items = adminQuery.data?.items ?? [];
    const totalPages = adminQuery.data?.totalPages ?? 1;
    const total = adminQuery.data?.total ?? 0;

    const filteredItems = useMemo(() => {
        const q = normalizeText(search);

        if (!q) return items;

        return items.filter((reservation) => {
            const haystack = [
                reservation.commonSpace.name,
                reservation.createdBy?.name,
                reservation.createdBy?.email,
                reservation.slot.label,
                reservation.id,
            ]
                .map(normalizeText)
                .join(" ");

            return haystack.includes(q);
        });
    }, [items, search]);

    const stats = useMemo(() => {
        const source = items;

        return {
            pending: source.filter((item) => item.status === "PENDING").length,
            approved: source.filter((item) => item.status === "APPROVED").length,
            rejected: source.filter((item) => item.status === "REJECTED").length,
            cancelled: source.filter((item) => item.status === "CANCELLED").length,
        };
    }, [items]);

    const isMutating = approveMutation.isPending || rejectMutation.isPending;

    function resetFilters() {
        setQuickTab("PENDING");
        setStatus("PENDING");
        setSpaceId("");
        setDate("");
        setSearch("");
        setPage(1);
    }

    function handleQuickTabChange(tab: QuickTab) {
        setQuickTab(tab);
        setStatus(tab === "PENDING" ? "PENDING" : "");
        setPage(1);
    }

    function handleApproveClick(reservation: ReservationAdminItem) {
        setModalConfig({ isOpen: true, action: "APPROVE", reservation });
    }

    function handleRejectClick(reservation: ReservationAdminItem) {
        setModalConfig({ isOpen: true, action: "REJECT", reservation });
    }

    function executeModalAction() {
        const { action, reservation } = modalConfig;
        if (!reservation) return;

        const isApprove = action === "APPROVE";
        const mutation = isApprove ? approveMutation : rejectMutation;

        mutation.mutate(reservation.id, {
            onSuccess: () => {
                showToast({
                    type: "success",
                    title: isApprove ? "Reserva aprobada" : "Reserva rechazada",
                    message: `La reserva fue ${isApprove ? "aprobada" : "rechazada"} correctamente.`,
                });
                setModalConfig((prev) => ({ ...prev, isOpen: false }));
            },
            onError: (error) => {
                showToast({
                    type: "error",
                    title: isApprove ? "No se pudo aprobar la reserva" : "No se pudo rechazar la reserva",
                    message: getApiErrorMessage(
                        error,
                        `No pudimos ${isApprove ? "aprobar" : "rechazar"} la reserva. Intenta nuevamente.`,
                    ),
                });
            },
        });
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-7 text-white">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-2">
                                <Link
                                    to="/reservations"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-sky-200 transition hover:text-white hover:underline"
                                >
                                    ← Volver a reservas
                                </Link>
                            </div>

                            <h1 className="text-2xl font-semibold tracking-tight inline-flex items-center gap-3">
                                Gestión de reservas
                                {globalPendingCount > 0 && (
                                    <span className="inline-flex items-center justify-center rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm ring-2 ring-white/10">
                                        {globalPendingCount} pendiente{globalPendingCount === 1 ? "" : "s"}
                                    </span>
                                )}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-200">
                                Revisa solicitudes, filtra por espacio o fecha y toma
                                decisiones rápidas desde el panel administrativo.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <AdminStatCard label="Pendientes" value={stats.pending} tone="amber" />
                            <AdminStatCard label="Aprobadas" value={stats.approved} tone="green" />
                            <AdminStatCard label="Rechazadas" value={stats.rejected} tone="rose" />
                            <AdminStatCard label="Canceladas" value={stats.cancelled} tone="slate" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Vista rápida
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Usa accesos rápidos y filtros para revisar reservas de forma eficiente.
                            </p>
                        </div>

                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                            <button
                                type="button"
                                onClick={() => handleQuickTabChange("PENDING")}
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm font-medium transition",
                                    quickTab === "PENDING"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900",
                                )}
                            >
                                Pendientes
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickTabChange("ALL")}
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm font-medium transition",
                                    quickTab === "ALL"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900",
                                )}
                            >
                                Todas
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <FieldShell label="Buscar">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Nombre, email, espacio o ID"
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                            />
                        </FieldShell>

                        <FieldShell label="Estado">
                            <select
                                value={status}
                                onChange={(e) => {
                                    const value = e.target.value as ReservationStatus | "";
                                    setStatus(value);
                                    setQuickTab(value === "PENDING" ? "PENDING" : "ALL");
                                    setPage(1);
                                }}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                            >
                                <option value="">Todos los estados</option>
                                <option value="PENDING">Pendientes</option>
                                <option value="APPROVED">Aprobadas</option>
                                <option value="REJECTED">Rechazadas</option>
                                <option value="CANCELLED">Canceladas</option>
                            </select>
                        </FieldShell>

                        <FieldShell label="Espacio">
                            <select
                                value={spaceId}
                                onChange={(e) => {
                                    setSpaceId(e.target.value);
                                    setPage(1);
                                }}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                            >
                                <option value="">Todos los espacios</option>
                                {spaces.map((space) => (
                                    <option key={space.id} value={space.id}>
                                        {space.name}
                                    </option>
                                ))}
                            </select>
                        </FieldShell>

                        <FieldShell label="Fecha">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setPage(1);
                                }}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                            />
                        </FieldShell>

                        <FieldShell label="Acciones">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
                            >
                                Limpiar filtros
                            </button>
                        </FieldShell>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Solicitudes de reserva
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Página {adminQuery.data?.page ?? 1} de {totalPages} · {total} registros en total
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {search.trim() && (
                                <span className="text-xs text-slate-500">
                                    Coincidencias en esta página: {filteredItems.length}
                                </span>
                            )}

                            {isMutating && (
                                <span className="text-xs font-medium text-slate-500">
                                    Guardando cambios...
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="hidden overflow-x-auto lg:block">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-6 py-3 text-left">Espacio</th>
                                <th className="px-6 py-3 text-left">Residente</th>
                                <th className="px-6 py-3 text-left">Bloque</th>
                                <th className="px-6 py-3 text-left">Fecha de uso</th>
                                <th className="px-6 py-3 text-left">Estado</th>
                                <th className="px-6 py-3 text-left">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {adminQuery.isLoading ? (
                                <>
                                    <AdminRowSkeleton />
                                    <AdminRowSkeleton />
                                    <AdminRowSkeleton />
                                    <AdminRowSkeleton />
                                </>
                            ) : adminQuery.isError ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-14 text-center">
                                        <EmptyState
                                            title="No se pudo cargar el panel administrativo"
                                            description="Si tu usuario no tiene rol de ADMINISTRADOR o COMITÉ, este resultado es esperado."
                                            tone="error"
                                        />
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-14 text-center">
                                        <EmptyState
                                            title="No hay reservas para los filtros seleccionados"
                                            description="Prueba cambiando el estado, el espacio, la fecha o el texto de búsqueda."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((reservation) => (
                                    <tr
                                        key={reservation.id}
                                        className="transition hover:bg-slate-50/80"
                                    >
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-semibold text-slate-900">
                                                {reservation.commonSpace.name}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                #{reservation.id.slice(0, 10)}...
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-top">
                                            <div className="font-medium text-slate-900">
                                                {reservation.createdBy?.name ?? "Sin nombre"}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {reservation.createdBy?.email ?? "Sin email"}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-top text-slate-700">
                                            <div className="font-medium">
                                                {reservation.slot.label}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {reservation.slot.startTime} - {reservation.slot.endTime}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-top text-slate-700">
                                            <div className="font-medium">
                                                {formatDateTime(reservation.startAt)}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Fin: {formatDateTime(reservation.endAt)}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 align-top">
                                            <StatusBadge status={reservation.status} />
                                        </td>

                                        <td className="px-6 py-4 align-top">
                                            <ReservationActions
                                                reservation={reservation}
                                                isBusy={isMutating}
                                                onApprove={handleApproveClick}
                                                onReject={handleRejectClick}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden">
                    {adminQuery.isLoading ? (
                        <>
                            <MobileCardSkeleton />
                            <MobileCardSkeleton />
                            <MobileCardSkeleton />
                        </>
                    ) : adminQuery.isError ? (
                        <div className="px-6 py-14">
                            <EmptyState
                                title="No se pudo cargar el panel administrativo"
                                description="Si tu usuario no tiene rol de ADMINISTRADOR o COMITÉ, este resultado es esperado."
                                tone="error"
                            />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="px-6 py-14">
                            <EmptyState
                                title="No hay reservas para los filtros seleccionados"
                                description="Prueba cambiando el estado, el espacio, la fecha o el texto de búsqueda."
                            />
                        </div>
                    ) : (
                        filteredItems.map((reservation) => (
                                <MobileReservationCard
                                    key={reservation.id}
                                    reservation={reservation}
                                    isBusy={isMutating}
                                    onApprove={handleApproveClick}
                                    onReject={handleRejectClick}
                                />
                        ))
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-500">
                        Mostrando {filteredItems.length} resultado{filteredItems.length === 1 ? "" : "s"} en esta página
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Anterior
                        </button>

                        <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                            {page} / {totalPages}
                        </div>

                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </section>

            {modalConfig.reservation && (
                <ConfirmActionModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
                    onConfirm={executeModalAction}
                    title={
                        modalConfig.action === "APPROVE"
                            ? "Aprobar reserva"
                            : "Rechazar reserva"
                    }
                    message={
                        modalConfig.action === "APPROVE"
                            ? "¿Estás seguro que deseas aprobar esta solicitud de reserva? El residente recibirá una notificación de la confirmación."
                            : "¿Estás seguro que deseas rechazar esta solicitud de reserva? El residente recibirá una notificación de rechazo."
                    }
                    confirmText={
                        modalConfig.action === "APPROVE" ? "Sí, aprobar" : "Sí, rechazar"
                    }
                    confirmTone={modalConfig.action === "APPROVE" ? "emerald" : "rose"}
                    isBusy={isMutating}
                    spaceName={modalConfig.reservation.commonSpace.name}
                    residentName={modalConfig.reservation.createdBy?.name ?? "Sin nombre"}
                    residentEmail={modalConfig.reservation.createdBy?.email ?? "Sin email"}
                    slotLabel={modalConfig.reservation.slot.label}
                    dateTime={`${formatDateTime(modalConfig.reservation.startAt)} - ${formatDateTime(modalConfig.reservation.endAt)}`}
                    statusBadge={<StatusBadge status={modalConfig.reservation.status} />}
                />
            )}
        </div>
    );
}

function FieldShell({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </label>
            {children}
        </div>
    );
}

function AdminStatCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "amber" | "green" | "rose" | "slate";
}) {
    const toneMap: Record<typeof tone, string> = {
        amber: "border-amber-400/30 bg-amber-400/10 text-amber-50",
        green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-50",
        rose: "border-rose-400/30 bg-rose-400/10 text-rose-50",
        slate: "border-white/15 bg-white/5 text-white",
    };

    return (
        <div className={cn("rounded-2xl border px-4 py-3", toneMap[tone])}>
            <div className="text-[11px] uppercase tracking-wide opacity-80">
                {label}
            </div>
            <div className="mt-1 text-xl font-semibold">{value}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: ReservationStatus }) {
    const map: Record<ReservationStatus, string> = {
        PENDING: "border border-amber-200 bg-amber-100 text-amber-700",
        APPROVED: "border border-green-200 bg-green-100 text-green-700",
        REJECTED: "border border-rose-200 bg-rose-100 text-rose-700",
        CANCELLED: "border border-slate-200 bg-slate-100 text-slate-700",
    };

    const labelMap: Record<ReservationStatus, string> = {
        PENDING: "Pendiente",
        APPROVED: "Aprobada",
        REJECTED: "Rechazada",
        CANCELLED: "Cancelada",
    };

    return (
        <span
            className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                map[status],
            )}
        >
            {labelMap[status]}
        </span>
    );
}

function ReservationActions({
    reservation,
    isBusy,
    onApprove,
    onReject,
}: {
    reservation: ReservationAdminItem;
    isBusy: boolean;
    onApprove: (reservation: ReservationAdminItem) => void;
    onReject: (reservation: ReservationAdminItem) => void;
}) {
    if (reservation.status !== "PENDING") {
        return (
            <span className="text-xs font-medium text-slate-400">
                Sin acciones disponibles
            </span>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={() => onApprove(reservation)}
                disabled={isBusy}
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Aprobar
            </button>

            <button
                type="button"
                onClick={() => onReject(reservation)}
                disabled={isBusy}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Rechazar
            </button>
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
        <div className="mx-auto max-w-md">
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

function MobileReservationCard({
    reservation,
    isBusy,
    onApprove,
    onReject,
}: {
    reservation: ReservationAdminItem;
    isBusy: boolean;
    onApprove: (reservation: ReservationAdminItem) => void;
    onReject: (reservation: ReservationAdminItem) => void;
}) {
    return (
        <div className="px-5 py-5">
            <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-slate-900">
                            {reservation.commonSpace.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            #{reservation.id.slice(0, 10)}...
                        </div>
                    </div>

                    <StatusBadge status={reservation.status} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                    <MobileInfo label="Residente" value={reservation.createdBy?.name ?? "Sin nombre"} />
                    <MobileInfo label="Email" value={reservation.createdBy?.email ?? "Sin email"} />
                    <MobileInfo label="Bloque" value={reservation.slot.label} />
                    <MobileInfo label="Horario" value={`${reservation.slot.startTime} - ${reservation.slot.endTime}`} />
                    <MobileInfo label="Inicio" value={formatDateTime(reservation.startAt)} />
                    <MobileInfo label="Fin" value={formatDateTime(reservation.endAt)} />
                </div>

                <div className="mt-4">
                    <ReservationActions
                        reservation={reservation}
                        isBusy={isBusy}
                        onApprove={onApprove}
                        onReject={onReject}
                    />
                </div>
            </div>
        </div>
    );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
        </div>
    );
}

function AdminRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4">
                <div className="h-4 w-28 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-36 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-16 rounded bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-36 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="h-7 w-24 rounded-full bg-slate-100" />
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    <div className="h-9 w-20 rounded-xl bg-slate-100" />
                    <div className="h-9 w-20 rounded-xl bg-slate-100" />
                </div>
            </td>
        </tr>
    );
}

function MobileCardSkeleton() {
    return (
        <div className="animate-pulse px-5 py-5">
            <div className="rounded-2xl border border-slate-200 p-4">
                <div className="h-4 w-36 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                <div className="mt-4 space-y-2">
                    <div className="h-12 rounded-xl bg-slate-100" />
                    <div className="h-12 rounded-xl bg-slate-100" />
                    <div className="h-12 rounded-xl bg-slate-100" />
                </div>
                <div className="mt-4 flex gap-2">
                    <div className="h-9 w-24 rounded-xl bg-slate-100" />
                    <div className="h-9 w-24 rounded-xl bg-slate-100" />
                </div>
            </div>
        </div>
    );
}