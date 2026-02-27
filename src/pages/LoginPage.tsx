import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

import logo from "../assets/brand/logo-las-violetas.jpg";

function isValidEmail(value: string) {
    // suficiente para front (no RFC completo)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeError(err: any): string {
    const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "Error al iniciar sesión";

    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
    try {
        return JSON.stringify(msg);
    } catch {
        return "Error al iniciar sesión";
    }
}

export default function LoginPage() {
    const nav = useNavigate();

    const emailRef = useRef<HTMLInputElement | null>(null);
    const passwordRef = useRef<HTMLInputElement | null>(null);

    const [email, setEmail] = useState(() => localStorage.getItem("lv_last_email") || "admin@test.com");
    const [password, setPassword] = useState("Admin123!");
    const [remember, setRemember] = useState(() => localStorage.getItem("lv_remember_email") === "1");

    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Si remember estaba activo, guarda email. Si no, bórralo.
    useEffect(() => {
        if (remember) {
            localStorage.setItem("lv_remember_email", "1");
            localStorage.setItem("lv_last_email", email);
        } else {
            localStorage.removeItem("lv_remember_email");
            localStorage.removeItem("lv_last_email");
        }
    }, [remember, email]);

    // Autofocus al cargar
    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    const emailOk = useMemo(() => isValidEmail(email), [email]);
    const passwordOk = useMemo(() => password.trim().length > 0, [password]);
    const canSubmit = emailOk && passwordOk && !loading;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;

        setError(null);
        setLoading(true);

        try {
            const res = await api.post("/auth/login", { email: email.trim(), password });

            const { access_token, refresh_token } = res.data ?? {};
            if (!access_token || !refresh_token) {
                throw new Error("Respuesta inválida del servidor (faltan tokens).");
            }

            localStorage.setItem("lv_access_token", access_token);
            localStorage.setItem("lv_refresh_token", refresh_token);

            nav("/");
        } catch (err: any) {
            setError(normalizeError(err));
            // UX: si falla, manda foco al password para reintentar
            setTimeout(() => passwordRef.current?.focus(), 0);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
                {/* Card principal */}
                <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(2,6,23,0.25)]">
                    {/* glow suave exterior */}
                    <div className="pointer-events-none absolute -inset-24 bg-gradient-to-r from-sky-200/50 via-cyan-200/30 to-indigo-200/40 blur-3xl" />

                    <div className="relative grid grid-cols-1 md:grid-cols-2">
                        {/* IZQUIERDA: Form */}
                        <div className="p-7 md:p-10">
                            {/* Marca */}
                            <div className="mb-8">
                                <div className="mb-6 flex items-center gap-3">
                                    <img
                                        src={logo}
                                        alt="Las Violetas"
                                        className="h-12 w-auto object-contain drop-shadow-sm"
                                        draggable={false}
                                    />
                                    <div>
                                        <p className="text-lg font-semibold leading-tight text-slate-900">
                                            Las Violetas
                                        </p>
                                        <p className="text-xs text-slate-500">Condominio Privado</p>
                                    </div>
                                </div>

                                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                    Hola!
                                </h1>
                                <p className="mt-2 text-sm text-slate-500">
                                    Ingresa a tu cuenta para continuar.
                                </p>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-4" noValidate>
                                {/* Email */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        E-mail
                                    </label>
                                    <input
                                        ref={emailRef}
                                        inputMode="email"
                                        autoComplete="email"
                                        placeholder="tu@email.com"
                                        value={email}
                                        disabled={loading}
                                        onChange={(e) => setEmail(e.target.value)}
                                        aria-invalid={email.length > 0 && !emailOk}
                                        className={[
                                            "w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition",
                                            "focus:ring-4 focus:ring-sky-100",
                                            email.length > 0 && !emailOk
                                                ? "border-red-300 focus:border-red-300"
                                                : "border-slate-200 focus:border-slate-300",
                                            loading ? "opacity-80" : "",
                                        ].join(" ")}
                                    />
                                    {email.length > 0 && !emailOk && (
                                        <p className="mt-1 text-xs text-red-600">
                                            Ingresa un correo válido.
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            ref={passwordRef}
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            value={password}
                                            disabled={loading}
                                            onChange={(e) => setPassword(e.target.value)}
                                            aria-invalid={!!error}
                                            aria-describedby={error ? "login-error" : undefined}
                                            className={[
                                                "w-full rounded-2xl border bg-white px-4 py-3 pr-12 text-sm outline-none transition",
                                                "focus:ring-4 focus:ring-sky-100",
                                                "border-slate-200 focus:border-slate-300",
                                                loading ? "opacity-80" : "",
                                            ].join(" ")}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            disabled={loading}
                                            className="absolute inset-y-0 right-2 my-auto rounded-xl px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            title={showPassword ? "Ocultar" : "Mostrar"}
                                        >
                                            {showPassword ? "Ocultar" : "Ver"}
                                        </button>
                                    </div>
                                </div>

                                {/* Row: remember + forgot */}
                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            disabled={loading}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200"
                                        />
                                        Recordarme
                                    </label>

                                    <button
                                        type="button"
                                        className="text-xs font-medium text-sky-600 hover:text-sky-700 disabled:opacity-60"
                                        disabled={loading}
                                        onClick={() => nav("/forgot-password")}
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>

                                {error && (
                                    <div
                                        id="login-error"
                                        role="alert"
                                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                    >
                                        {error}
                                    </div>
                                )}

                                {/* Botón */}
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className={[
                                        "mt-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition",
                                        "bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300",
                                        "disabled:cursor-not-allowed disabled:opacity-60",
                                        "focus:outline-none focus:ring-4 focus:ring-sky-100",
                                    ].join(" ")}
                                >
                                    {loading ? "Entrando..." : "INICIAR SESIÓN"}
                                </button>

                                {/* Register */}
                                <p className="pt-2 text-center text-xs text-slate-500">
                                    ¿No tienes cuenta?{" "}
                                    <button
                                        type="button"
                                        className="font-semibold text-sky-600 hover:text-sky-700 disabled:opacity-60"
                                        disabled={loading}
                                        onClick={() => nav("/register")}
                                    >
                                        Crear
                                    </button>
                                </p>

                                {/* Footer micro */}
                                <p className="pt-2 text-center text-[11px] text-slate-400">
                                    Protegido por autenticación segura · Las Violetas
                                </p>
                            </form>
                        </div>

                        {/* DERECHA: Panel azul */}
                        <div className="relative hidden md:block">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-sky-500 to-cyan-400" />

                            {/* patrón sutil */}
                            <svg
                                className="absolute inset-0 opacity-[0.12]"
                                viewBox="0 0 400 400"
                                aria-hidden="true"
                            >
                                <defs>
                                    <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="2" fill="white" />
                                    </pattern>
                                </defs>
                                <rect width="400" height="400" fill="url(#dots)" />
                            </svg>

                            {/* brillo suave */}
                            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
                            <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />

                            <div className="relative flex h-full flex-col justify-center p-10 text-white">
                                <h2 className="text-3xl font-semibold tracking-tight">
                                    ¡Bienvenido de vuelta!
                                </h2>
                                <p className="mt-3 max-w-sm text-sm text-white/90">
                                    Accede para revisar gastos comunes, solicitudes y avisos del condominio.
                                </p>

                                <div className="mt-8 space-y-3">
                                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-white/85 backdrop-blur">
                                        <div className="font-semibold">Todo en un solo lugar</div>
                                        <div className="mt-1 text-white/80">
                                            Pagos · Mantenciones · Comunicaciones
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-white/85 backdrop-blur">
                                        <div className="font-semibold">Soporte del comité</div>
                                        <div className="mt-1 text-white/80">
                                            Trazabilidad y transparencia para residentes.
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 text-xs text-white/70">
                                    Las Violetas · Condominio Privado
                                </div>
                            </div>
                        </div>
                        {/* /Panel */}
                    </div>
                </div>
            </div>
        </div>
    );
}