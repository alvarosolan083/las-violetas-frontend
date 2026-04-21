import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

type AppShellProps = {
    children: React.ReactNode;
};

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const { user, membership, logout, isLoggingOut } = useAuth();

    const canManage =
        membership?.role === "ADMINISTRADOR" || membership?.role === "COMITE";

    const navItemClass = ({ isActive }: { isActive: boolean }) =>
        cn(
            "rounded-xl px-3 py-2 text-sm font-medium transition",
            isActive
                ? "bg-sky-100 text-sky-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        );

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
                    <div>
                        <div className="font-semibold text-slate-800">
                            Las Violetas · {membership?.condoId ?? "Condominio"}
                        </div>
                        <div className="text-sm text-slate-500">
                            {user?.name || user?.email} · {membership?.role || "Sin rol"}
                        </div>
                    </div>
                    
                    <div>
                        <button
                            onClick={logout}
                            disabled={isLoggingOut}
                            className="group flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none transition-all hover:bg-rose-50 hover:text-rose-600 focus:ring-4 focus:ring-rose-100 disabled:opacity-50"
                        >
                            <span>{isLoggingOut ? "Saliendo…" : "Cerrar sesión"}</span>
                            {!isLoggingOut && (
                                <svg
                                    className="h-4 w-4 text-slate-400 transition-colors group-hover:text-rose-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 pb-4">
                    <nav className="flex flex-wrap gap-2">
                        <NavLink to="/" end className={navItemClass}>
                            Dashboard
                        </NavLink>

                        <NavLink to="/tickets" className={navItemClass}>
                            Tickets
                        </NavLink>

                        <NavLink to="/announcements" className={navItemClass}>
                            Anuncios
                        </NavLink>

                        <NavLink to="/reservations" className={navItemClass}>
                            Reservas
                        </NavLink>

                        <NavLink to="/documents" className={navItemClass}>
                            Documentos
                        </NavLink>

                        {canManage && (
                            <>
                                <NavLink to="/reservations/admin" className={navItemClass}>
                                    Gestión reservas
                                </NavLink>

                                <NavLink to="/documents/admin" className={navItemClass}>
                                    Gestión documentos
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-4">{children}</main>
        </div>
    );
};