import { useNavigate } from "react-router-dom";
import logo from "../assets/brand/logo-las-violetas.jpg";
import { storage } from "../lib/storage";

export function AppShell({
    title,
    subtitle,
    right,
    children,
}: {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    const nav = useNavigate();
    const condoId = storage.getCondoId();

    function logout() {
        localStorage.removeItem("lv_access_token");
        localStorage.removeItem("lv_refresh_token");
        nav("/login", { replace: true });
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Las Violetas" className="h-9 w-auto object-contain" />
                        <div>
                            <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
                            <p className="text-xs text-slate-500">
                                {subtitle ?? `Condominio: ${condoId}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {right}
                        <button
                            onClick={logout}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
    );
}