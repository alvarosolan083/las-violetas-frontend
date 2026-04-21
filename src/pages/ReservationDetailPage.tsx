import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    useCommonSpaceDetail,
    useSpaceAvailability,
} from "../features/reservations/reservations.hooks";
import { useCreateReservation } from "../features/reservations/reservations.mutations";
import type { CommonSpaceSlot } from "../features/reservations/reservations.api";
import { useToast } from "../hooks/useToast";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function formatAdvance(hours: number) {
    if (hours === 48) return "2 días";
    if (hours === 24) return "24 horas";
    if (hours === 12) return "12 horas";
    return `${hours} hrs`;
}

function formatMoney(value: number) {
    return `$ ${value}`;
}

function formatWeekdays(days: number[]) {
    if (!days.length) return "Todos los días";
    const labels: Record<number, string> = {
        0: "Domingo",
        1: "Lunes",
        2: "Martes",
        3: "Miércoles",
        4: "Jueves",
        5: "Viernes",
        6: "Sábado",
    };
    return days.map((d) => labels[d] ?? d).join(", ");
}

function formatDateRange(start?: string | null, end?: string | null) {
    if (!start && !end) return "Sin restricción";
    const startText = start ? new Date(start).toLocaleDateString() : "—";
    const endText = end ? new Date(end).toLocaleDateString() : "—";
    return `${startText} — ${endText}`;
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

export default function ReservationDetailPage() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const detailQuery = useCommonSpaceDetail(spaceId);
    const createMutation = useCreateReservation();

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlotId, setSelectedSlotId] = useState("");
    const [showFullDescription, setShowFullDescription] = useState(false);

    const availabilityQuery = useSpaceAvailability(spaceId, selectedDate);

    const space = detailQuery.data;

    const selectedSlot = useMemo(() => {
        return space?.slots.find((slot) => slot.id === selectedSlotId) ?? null;
    }, [space?.slots, selectedSlotId]);

    const availabilityMap = useMemo(() => {
        if (!availabilityQuery.data) return new Map();

        return new Map(
            availabilityQuery.data.slots.map((slot) => [slot.slotId, slot.status])
        );
    }, [availabilityQuery.data]);

    const canSubmit = !!space && !!selectedDate && !!selectedSlotId;

    const descriptionPreview = useMemo(() => {
        if (!space?.description) return "";
        const clean = space.description.replace(/\s+/g, " ").trim();
        if (clean.length <= 420) return clean;
        return `${clean.slice(0, 420)}...`;
    }, [space?.description]);

    const statusLabel = space?.requiresApproval
        ? "Pendiente de aprobación"
        : "Aprobada automáticamente";

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!space || !selectedDate || !selectedSlotId) return;

        createMutation.mutate(
            {
                spaceId: space.id,
                slotId: selectedSlotId,
                date: selectedDate,
            },
            {
                onSuccess: () => {
                    showToast({
                        type: "success",
                        title: "Reserva creada",
                        message: "Tu solicitud fue enviada correctamente.",
                    });
                    navigate("/reservations");
                },
                onError: (error) => {
                    showToast({
                        type: "error",
                        title: "No se pudo crear la reserva",
                        message: getApiErrorMessage(
                            error,
                            "Revisa las reglas del espacio y vuelve a intentarlo."
                        ),
                    });
                },
            }
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="mb-2">
                            <Link
                                to="/reservations"
                                className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 transition hover:text-sky-800 hover:underline"
                            >
                                ← Volver a espacios comunes
                            </Link>
                        </div>

                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            {space?.name ?? "Cargando espacio..."}
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            {space
                                ? showFullDescription
                                    ? space.description || "Sin descripción disponible."
                                    : descriptionPreview ||
                                    "Selecciona una fecha y un bloque para reservar."
                                : "Selecciona una fecha y un bloque para reservar."}
                        </p>

                        {space?.description && space.description.length > 420 ? (
                            <button
                                type="button"
                                onClick={() => setShowFullDescription((prev) => !prev)}
                                className="mt-3 text-sm font-medium text-sky-700 transition hover:text-sky-800 hover:underline"
                            >
                                {showFullDescription ? "Ver menos" : "Ver detalle completo"}
                            </button>
                        ) : null}
                    </div>

                    {space ? (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[520px]">
                            <RulePill
                                label="Anticipación"
                                value={formatAdvance(space.advanceHours)}
                            />
                            <RulePill label="Límite diario" value={`${space.dailyLimit}`} />
                            <RulePill label="Límite semanal" value={`${space.weeklyLimit}`} />
                            <RulePill
                                label="Cancelar antes"
                                value={`${space.cancelBeforeHours} hrs`}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            {detailQuery.isLoading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="animate-pulse space-y-4">
                        <div className="h-5 w-48 rounded bg-slate-100" />
                        <div className="h-24 rounded-2xl bg-slate-100" />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="h-28 rounded-2xl bg-slate-100" />
                            <div className="h-28 rounded-2xl bg-slate-100" />
                        </div>
                    </div>
                </div>
            ) : detailQuery.isError || !space ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                    No se pudo cargar el detalle del espacio.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        <form
                            onSubmit={onSubmit}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="space-y-8">
                                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <InfoPanel
                                        title="Días habilitados"
                                        value={formatWeekdays(space.allowedWeekdays)}
                                        hint="Estos son los días configurados para este espacio."
                                    />
                                    <InfoPanel
                                        title="Temporada"
                                        value={formatDateRange(space.seasonStart, space.seasonEnd)}
                                        hint="Si el espacio tiene temporada, solo se puede reservar dentro de ese período."
                                    />
                                </section>

                                <section>
                                    <div className="mb-4">
                                        <h2 className="text-base font-semibold text-slate-900">
                                            1. Elige el día de la reserva
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Selecciona una fecha válida según las reglas del espacio.
                                        </p>
                                    </div>

                                    <div className="max-w-sm">
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Fecha
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                        />
                                    </div>
                                </section>

                                <section>
                                    <div className="mb-4">
                                        <h2 className="text-base font-semibold text-slate-900">
                                            2. Elige el bloque horario
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Escoge uno de los bloques configurados para este espacio.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {space.slots.map((slot) => (
                                            <SlotCard
                                                key={slot.id}
                                                slot={slot}
                                                selected={selectedSlotId === slot.id}
                                                status={availabilityMap.get(slot.id)}
                                                onSelect={() => setSelectedSlotId(slot.id)}
                                            />
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                Confirmación
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Al enviar la solicitud, la reserva quedará sujeta a las
                                                reglas del condominio.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => navigate("/reservations")}
                                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                                            >
                                                Cancelar
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={!canSubmit || createMutation.isPending}
                                                className={cn(
                                                    "rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-4 focus:ring-sky-100",
                                                    !canSubmit || createMutation.isPending
                                                        ? "cursor-not-allowed bg-slate-300"
                                                        : "bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300"
                                                )}
                                            >
                                                {createMutation.isPending
                                                    ? "Reservando..."
                                                    : "Confirmar reserva"}
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </form>
                    </div>

                    <div className="xl:col-span-1">
                        <aside className="sticky top-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-slate-900">
                                    Resumen de reserva
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Verifica la información antes de confirmar.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <SummaryItem label="Espacio" value={space.name} />
                                <SummaryItem
                                    label="Fecha"
                                    value={selectedDate || "Selecciona un día"}
                                />
                                <SummaryItem
                                    label="Bloque"
                                    value={selectedSlot?.label || "Selecciona un bloque"}
                                />
                                <SummaryItem label="Estado inicial" value={statusLabel} />
                                <SummaryItem
                                    label="Cancelar antes"
                                    value={`${space.cancelBeforeHours} horas antes`}
                                />
                                <SummaryItem
                                    label="Monto a pagar"
                                    value={formatMoney(space.price)}
                                />
                            </div>

                            <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-slate-700">
                                {space.requiresApproval
                                    ? "Esta solicitud quedará pendiente hasta ser revisada por administración o comité."
                                    : "Esta reserva quedará aprobada automáticamente al confirmar."}
                            </div>

                            {selectedDate && selectedSlot ? (
                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                    <div className="font-semibold text-slate-900">
                                        Selección actual
                                    </div>
                                    <div className="mt-2">
                                        {selectedDate} · {selectedSlot.label}
                                    </div>
                                </div>
                            ) : null}
                        </aside>
                    </div>
                </div>
            )}
        </div>
    );
}

function SlotCard({
    slot,
    selected,
    status,
    onSelect,
}: {
    slot: CommonSpaceSlot;
    selected: boolean;
    status?: "AVAILABLE" | "PENDING" | "BOOKED";
    onSelect: () => void;
}) {
    const disabled = status === "BOOKED";

    const statusStyles = {
        AVAILABLE: "border-green-200 bg-green-50",
        PENDING: "border-amber-200 bg-amber-50",
        BOOKED: "border-red-200 bg-red-50 opacity-60 cursor-not-allowed",
    };

    const statusLabel = {
        AVAILABLE: "Disponible",
        PENDING: "Pendiente",
        BOOKED: "Ocupado",
    };

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onSelect}
            className={cn(
                "rounded-2xl border p-4 text-left transition",
                selected
                    ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                    : status
                        ? statusStyles[status]
                        : "border-slate-200 bg-white hover:bg-slate-50"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-900">
                        {slot.label}
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                        {slot.startTime} → {slot.endTime}
                    </div>
                </div>

                {status && (
                    <span
                        className={cn(
                            "rounded-full px-2 py-1 text-[11px] font-semibold",
                            status === "AVAILABLE" && "bg-green-600 text-white",
                            status === "PENDING" && "bg-amber-500 text-white",
                            status === "BOOKED" && "bg-red-500 text-white"
                        )}
                    >
                        {statusLabel[status]}
                    </span>
                )}
            </div>
        </button>
    );
}

function RulePill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function InfoPanel({
    title,
    value,
    hint,
}: {
    title: string;
    value: string;
    hint: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {title}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
            <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div>
        </div>
    );
}