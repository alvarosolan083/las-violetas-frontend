import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/brand/logo-las-violetas.jpg";
import { storage } from "../lib/storage";
import { useCreateTicket } from "../features/tickets/tickets.mutations";
import type { TicketPriority } from "../features/tickets/tickets.api";

const CATEGORIES = ["MANTENCIÓN", "SEGURIDAD", "ASEO", "ADMINISTRACIÓN", "OTROS"] as const;

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function TicketsNewPage() {
    const nav = useNavigate();
    const condoId = storage.getCondoId();
    const createTicket = useCreateTicket();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("MANTENCIÓN");
    const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
    const [error, setError] = useState<string | null>(null);

    const titleOk = title.trim().length >= 4;
    const descOk = description.trim().length >= 10;

    const canSubmit = useMemo(() => {
        return titleOk && descOk && !createTicket.isPending;
    }, [titleOk, descOk, createTicket.isPending]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!canSubmit) return;

        try {
            await createTicket.mutateAsync({
                condoId,
                title: title.trim(),
                description: description.trim(),
                category,
                priority,
            });

            // ✅ Opción A: vuelve al dashboard (cero 404)
            nav("/", { replace: true });

            // Si quieres Opción B, comenta la línea de arriba y usa:
            // const newId = (created as any)?.id;
            // if (newId) nav(`/tickets/${newId}`, { replace: true });
            // else nav("/", { replace: true });
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "No se pudo crear el ticket";
            setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Las Violetas" className="h-9 w-auto object-contain" />
                        <div>
                            <h1 className="text-sm font-semibold text-slate-900">Las Violetas</h1>
                            <p className="text-xs text-slate-500">Crear ticket</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => nav(-1)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                        >
                            Volver
                        </button>

                        <button
                            onClick={() => nav("/")}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                        >
                            Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-10">
                {/* Card principal estilo Login */}
                <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(2,6,23,0.25)]">
                    {/* glow suave exterior */}
                    <div className="pointer-events-none absolute -inset-24 bg-gradient-to-r from-sky-200/50 via-cyan-200/30 to-indigo-200/40 blur-3xl" />

                    <div className="relative grid grid-cols-1 md:grid-cols-2">
                        {/* LEFT: Form */}
                        <div className="p-7 md:p-10">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Nuevo ticket</h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Registra una solicitud o problema del condominio con trazabilidad.
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                    Condominio: <span className="font-semibold text-slate-600">{condoId}</span>
                                </p>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                                {/* Title */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ej: Portón no cierra / Fuga de agua / Luz pasillo…"
                                        className={cn(
                                            "w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition",
                                            "focus:ring-4 focus:ring-sky-100",
                                            title.length > 0 && !titleOk
                                                ? "border-red-300 focus:border-red-300"
                                                : "border-slate-200 focus:border-slate-300"
                                        )}
                                    />
                                    {title.length > 0 && !titleOk && (
                                        <p className="mt-1 text-xs text-red-600">Mínimo 4 caracteres.</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe el problema, ubicación (torre/piso), y cualquier detalle útil…"
                                        className={cn(
                                            "min-h-[140px] w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition",
                                            "focus:ring-4 focus:ring-sky-100",
                                            description.length > 0 && !descOk
                                                ? "border-red-300 focus:border-red-300"
                                                : "border-slate-200 focus:border-slate-300"
                                        )}
                                    />
                                    {description.length > 0 && !descOk && (
                                        <p className="mt-1 text-xs text-red-600">Mínimo 10 caracteres.</p>
                                    )}
                                </div>

                                {/* Row */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Categoría</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as any)}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-sky-100"
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Prioridad</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as TicketPriority)}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-sky-100"
                                        >
                                            <option value="LOW">LOW</option>
                                            <option value="MEDIUM">MEDIUM</option>
                                            <option value="HIGH">HIGH</option>
                                            <option value="URGENT">URGENT</option>
                                        </select>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => nav(-1)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className={cn(
                                            "rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition",
                                            "bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300",
                                            "focus:outline-none focus:ring-4 focus:ring-sky-100",
                                            "disabled:cursor-not-allowed disabled:opacity-60"
                                        )}
                                    >
                                        {createTicket.isPending ? "Creando..." : "Crear ticket"}
                                    </button>
                                </div>

                                <p className="pt-2 text-center text-[11px] text-slate-400">
                                    Trazabilidad · Transparencia · Las Violetas
                                </p>
                            </form>
                        </div>

                        {/* RIGHT: Panel estilo Login */}
                        <div className="relative hidden md:block">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-sky-500 to-cyan-400" />

                            <svg className="absolute inset-0 opacity-[0.12]" viewBox="0 0 400 400" aria-hidden="true">
                                <defs>
                                    <pattern id="dots-tickets" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="2" fill="white" />
                                    </pattern>
                                </defs>
                                <rect width="400" height="400" fill="url(#dots-tickets)" />
                            </svg>

                            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
                            <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />

                            <div className="relative flex h-full flex-col justify-center p-10 text-white">
                                <h3 className="text-3xl font-semibold tracking-tight">Registro claro</h3>
                                <p className="mt-3 max-w-sm text-sm text-white/90">
                                    Mientras mejor el detalle, más rápido se resuelve. Agrega ubicación, contexto y prioridad real.
                                </p>

                                <div className="mt-8 space-y-3">
                                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-white/85 backdrop-blur">
                                        <div className="font-semibold">Buenas prácticas</div>
                                        <div className="mt-1 text-white/80">
                                            Título concreto · Descripción detallada · Prioridad correcta
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-white/85 backdrop-blur">
                                        <div className="font-semibold">Siguiente paso</div>
                                        <div className="mt-1 text-white/80">
                                            Luego conectamos adjuntos + timeline (backend ya lo tiene).
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 text-xs text-white/70">Las Violetas · Condominio Privado</div>
                            </div>
                        </div>
                        {/* /Right */}
                    </div>
                </div>
            </div>
        </div>
    );
}