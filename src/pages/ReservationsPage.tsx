import { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import {
    useCommonSpaces,
    useMyReservations,
    useSpaceAvailability,
} from "../features/reservations/reservations.hooks";
import { useCancelReservation } from "../features/reservations/reservations.mutations";
import type {
    CommonSpace,
    ReservationItem,
    ReservationStatus,
    SlotAvailabilityStatus,
} from "../features/reservations/reservations.api";
import { useToast } from "../hooks/useToast";
import { useCondoAccess } from "../features/auth/useCondoAccess";

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

function formatAdvance(hours: number) {
    if (hours === 48) return "2 días";
    if (hours === 24) return "24 horas";
    if (hours === 12) return "12 horas";
    return `${hours} hrs`;
}

function getSpaceSubtitle(space: CommonSpace) {
    const name = space.name.toLowerCase();

    if (name.includes("piscina")) {
        return "Uso recreativo de la piscina del condominio.";
    }

    if (name.includes("quincho")) {
        return "Espacio para asados, reuniones y celebraciones.";
    }

    if (name.includes("salón")) {
        return "Espacio para eventos, celebraciones y reuniones.";
    }

    return "Espacio común disponible para reserva.";
}

function getTodayDateInputValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

type SpaceLiveStatus = "AVAILABLE" | "PENDING" | "FULL" | "EMPTY";

function getSpaceLiveStatus(
    statuses: SlotAvailabilityStatus[],
): {
    status: SpaceLiveStatus;
    label: string;
    tone: string;
} {
    if (statuses.length === 0) {
        return {
            status: "EMPTY",
            label: "Sin bloques hoy",
            tone: "bg-slate-100 text-slate-700",
        };
    }

    const hasAvailable = statuses.includes("AVAILABLE");
    const hasPending = statuses.includes("PENDING");
    const allBookedOrPending = statuses.every(
        (status) => status === "BOOKED" || status === "PENDING",
    );

    if (hasAvailable && hasPending) {
        return {
            status: "PENDING",
            label: "Con solicitudes",
            tone: "bg-amber-100 text-amber-700",
        };
    }

    if (hasAvailable) {
        return {
            status: "AVAILABLE",
            label: "Disponible hoy",
            tone: "bg-emerald-100 text-emerald-700",
        };
    }

    if (allBookedOrPending) {
        return {
            status: "FULL",
            label: "Completo hoy",
            tone: "bg-rose-100 text-rose-700",
        };
    }

    return {
        status: "EMPTY",
        label: "Sin bloques hoy",
        tone: "bg-slate-100 text-slate-700",
    };
}

function buildAvailabilitySummary(
    space: CommonSpace,
    statuses: SlotAvailabilityStatus[],
) {
    const total = space.slots.length;
    const available = statuses.filter((status) => status === "AVAILABLE").length;
    const pending = statuses.filter((status) => status === "PENDING").length;
    const booked = statuses.filter((status) => status === "BOOKED").length;

    if (!statuses.length) {
        return `${total} bloque${total === 1 ? "" : "s"} configurado${total === 1 ? "" : "s"}.`;
    }

    if (available === total) {
        return `${available} de ${total} bloques disponibles hoy.`;
    }

    if (available > 0 && pending > 0) {
        return `${available} disponibles y ${pending} con solicitud pendiente.`;
    }

    if (available > 0) {
        return `${available} de ${total} bloques disponibles hoy.`;
    }

    if (pending > 0 && booked > 0) {
        return `${pending} pendiente${pending === 1 ? "" : "s"} y ${booked} ocupado${booked === 1 ? "" : "s"} hoy.`;
    }

    if (pending > 0) {
        return `${pending} bloque${pending === 1 ? "" : "s"} con solicitud pendiente.`;
    }

    if (booked > 0) {
        return `No hay bloques disponibles hoy.`;
    }

    return `${total} bloque${total === 1 ? "" : "s"} configurado${total === 1 ? "" : "s"}.`;
}

export default function ReservationsPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { canManageReservations } = useCondoAccess();

    const [tab, setTab] = useState<"future" | "past">("future");
    const [selectedSpace, setSelectedSpace] = useState<CommonSpace | null>(null);

    const spacesQuery = useCommonSpaces();
    const reservationsQuery = useMyReservations(tab);
    const cancelMutation = useCancelReservation();

    const spaces = spacesQuery.data?.items ?? [];
    const reservations = reservationsQuery.data?.items ?? [];

    function handleCancelReservation(reservation: ReservationItem) {
        cancelMutation.mutate(reservation.id, {
            onSuccess: () => {
                showToast({
                    type: "success",
                    title: "Reserva cancelada",
                    message: "La reserva fue cancelada correctamente.",
                });
            },
            onError: (error) => {
                showToast({
                    type: "error",
                    title: "No se pudo cancelar la reserva",
                    message: getApiErrorMessage(
                        error,
                        "No pudimos cancelar la reserva. Intenta nuevamente.",
                    ),
                });
            },
        });
    }

    return (
        <>
            <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">
                                Espacios comunes
                            </h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Reserva piscina, quinchos y salones desde la plataforma.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            {canManageReservations && (
                                <button
                                    onClick={() => navigate("/reservations/admin")}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                    Gestión admin/comité
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (spaces.length > 0) {
                                        navigate(`/reservations/${spaces[0].id}`);
                                    }
                                }}
                                className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
                            >
                                Nueva reserva
                            </button>
                        </div>
                    </div>
                </div>

                <section className="space-y-4">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                            Selecciona un espacio
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Revisa reglas, bloques horarios y disponibilidad general.
                        </p>
                    </div>

                    {spacesQuery.isLoading ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <SpaceSkeleton />
                            <SpaceSkeleton />
                            <SpaceSkeleton />
                        </div>
                    ) : spacesQuery.isError ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            Error cargando los espacios comunes.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {spaces.map((space) => (
                                <SpaceCard
                                    key={space.id}
                                    space={space}
                                    onReserve={() => navigate(`/reservations/${space.id}`)}
                                    onDetail={() => setSelectedSpace(space)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Mis reservas
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Estado de solicitudes, aprobaciones y reservas pasadas.
                                </p>
                            </div>

                            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setTab("future")}
                                    className={cn(
                                        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                                        tab === "future"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900",
                                    )}
                                >
                                    Futuras
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTab("past")}
                                    className={cn(
                                        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                                        tab === "past"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900",
                                    )}
                                >
                                    Pasadas
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {reservationsQuery.isLoading ? (
                            <>
                                <ReservationSkeleton />
                                <ReservationSkeleton />
                            </>
                        ) : reservationsQuery.isError ? (
                            <div className="p-6 text-sm text-red-600">
                                Error cargando tus reservas.
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="p-6 text-sm text-slate-500">
                                No hay reservas en esta pestaña.
                            </div>
                        ) : (
                            reservations.map((reservation) => (
                                <ReservationRow
                                    key={reservation.id}
                                    reservation={reservation}
                                    canCancel={
                                        tab === "future" &&
                                        (reservation.status === "PENDING" ||
                                            reservation.status === "APPROVED")
                                    }
                                    onCancel={() => handleCancelReservation(reservation)}
                                    isCancelling={
                                        cancelMutation.isPending &&
                                        cancelMutation.variables === reservation.id
                                    }
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>

            <SpaceDetailModal
                space={selectedSpace}
                onClose={() => setSelectedSpace(null)}
                onReserve={(space) => {
                    setSelectedSpace(null);
                    navigate(`/reservations/${space.id}`);
                }}
            />
        </>
    );
}

function SpaceCard({
    space,
    onReserve,
    onDetail,
}: {
    space: CommonSpace;
    onReserve: () => void;
    onDetail: () => void;
}) {
    const today = getTodayDateInputValue();
    const availabilityQuery = useSpaceAvailability(space.id, today);

    const statuses = availabilityQuery.data?.slots.map((slot) => slot.status) ?? [];
    const liveStatus = getSpaceLiveStatus(statuses);
    const subtitle = getSpaceSubtitle(space);
    const availabilitySummary = buildAvailabilitySummary(space, statuses);

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">
                        {space.name}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                        {subtitle}
                    </p>
                </div>

                <span
                    className={cn(
                        "shrink-0 rounded-xl px-3 py-1 text-xs font-semibold",
                        space.requiresApproval
                            ? "bg-sky-50 text-sky-700"
                            : "bg-emerald-50 text-emerald-700",
                    )}
                >
                    {space.requiresApproval ? "Con aprobación" : "Automático"}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                    className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        liveStatus.tone,
                    )}
                >
                    {liveStatus.label}
                </span>

                <span className="text-xs text-slate-500">
                    {availabilityQuery.isLoading
                        ? "Revisando disponibilidad de hoy..."
                        : availabilityQuery.isError
                            ? "No se pudo cargar disponibilidad de hoy."
                            : availabilitySummary}
                </span>
            </div>

            {space.price > 0 && (
                <div className="mt-3 text-sm font-semibold text-slate-900">
                    $ {space.price.toLocaleString()}
                </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <InfoItem
                    label="Anticipación"
                    value={formatAdvance(space.advanceHours)}
                />
                <InfoItem
                    label="Límite diario"
                    value={`${space.dailyLimit}`}
                />
                <InfoItem
                    label="Límite semanal"
                    value={`${space.weeklyLimit}`}
                />
                <InfoItem
                    label="Cancelar antes"
                    value={`${space.cancelBeforeHours} hrs`}
                />
            </div>

            <div className="mt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bloques
                </div>

                <div className="flex flex-wrap gap-2">
                    {space.slots.slice(0, 4).map((slot) => (
                        <span
                            key={slot.id}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                            {slot.label}
                        </span>
                    ))}

                    {space.slots.length > 4 && (
                        <span className="text-xs text-slate-400">
                            +{space.slots.length - 4}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-5 flex gap-2">
                <button
                    onClick={onDetail}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                >
                    Detalle
                </button>

                <button
                    onClick={onReserve}
                    className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300"
                >
                    Reservar
                </button>
            </div>
        </div>
    );
}

function SpaceDetailModal({
    space,
    onClose,
    onReserve,
}: {
    space: CommonSpace | null;
    onClose: () => void;
    onReserve: (space: CommonSpace) => void;
}) {
    if (!space) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            {space.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Reglas, horarios y condiciones del espacio.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoCard label="Valor de reserva" value={`$ ${space.price}`} />
                        <InfoCard
                            label="Anticipación mínima"
                            value={formatAdvance(space.advanceHours)}
                        />
                        <InfoCard
                            label="Límite de reservas en la semana"
                            value={`${space.weeklyLimit}`}
                        />
                        <InfoCard
                            label="Límite de reservas en el día"
                            value={`${space.dailyLimit}`}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InfoCard
                            label="Cancelar antes"
                            value={`${space.cancelBeforeHours} hrs`}
                        />
                        <InfoCard
                            label="Modo de aprobación"
                            value={
                                space.requiresApproval
                                    ? "Requiere aprobación"
                                    : "Aprobación automática"
                            }
                        />
                    </div>

                    <div className="mt-6">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bloques disponibles
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {space.slots.map((slot) => (
                                <span
                                    key={slot.id}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                    {slot.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h4 className="text-sm font-semibold text-slate-900">Detalle</h4>
                        <div className="mt-3 max-h-[42vh] overflow-y-auto whitespace-pre-line pr-1 text-sm leading-7 text-slate-700">
                            {space.description || "Sin detalle disponible."}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                    >
                        Cerrar
                    </button>

                    <button
                        onClick={() => onReserve(space)}
                        className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300"
                    >
                        Reservar {space.name}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReservationRow({
    reservation,
    canCancel,
    onCancel,
    isCancelling,
}: {
    reservation: ReservationItem;
    canCancel: boolean;
    onCancel: () => void;
    isCancelling: boolean;
}) {
    return (
        <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                        {reservation.commonSpace.name}
                    </h3>
                    <StatusBadge status={reservation.status} />
                </div>

                <p className="mt-1 text-sm text-slate-600">
                    {reservation.slot.label} · {new Date(reservation.startAt).toLocaleString()}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    Reserva #{reservation.id.slice(0, 10)}...
                </p>
            </div>

            <div className="flex items-center gap-2">
                {canCancel ? (
                    <button
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isCancelling ? "Cancelando..." : "Cancelar"}
                    </button>
                ) : null}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: ReservationStatus }) {
    const map: Record<ReservationStatus, string> = {
        PENDING: "bg-amber-100 text-amber-700",
        APPROVED: "bg-green-100 text-green-700",
        REJECTED: "bg-rose-100 text-rose-700",
        CANCELLED: "bg-slate-100 text-slate-700",
    };

    const labelMap: Record<ReservationStatus, string> = {
        PENDING: "Pendiente",
        APPROVED: "Aprobada",
        REJECTED: "Rechazada",
        CANCELLED: "Cancelada",
    };

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status]}`}>
            {labelMap[status]}
        </span>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function SpaceSkeleton() {
    return (
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
            <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="h-16 rounded-2xl bg-slate-100" />
                <div className="h-16 rounded-2xl bg-slate-100" />
                <div className="h-16 rounded-2xl bg-slate-100" />
                <div className="h-16 rounded-2xl bg-slate-100" />
            </div>
            <div className="mt-5 h-10 rounded-xl bg-slate-100" />
        </div>
    );
}

function ReservationSkeleton() {
    return (
        <div className="animate-pulse px-6 py-5">
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-52 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
        </div>
    );
}