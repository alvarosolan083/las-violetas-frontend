import { isRouteErrorResponse, useRouteError, useNavigate } from "react-router-dom";

export default function RouteErrorPage() {
    const err = useRouteError();
    const nav = useNavigate();

    const status = isRouteErrorResponse(err) ? err.status : 500;
    const title =
        status === 404 ? "Página no encontrada" : "Ocurrió un error";
    const hint =
        status === 404
            ? "La ruta que intentaste abrir no existe o fue movida."
            : "Intenta nuevamente. Si persiste, revisa consola/network.";

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-10">
                <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-500">Error {status}</p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
                            <p className="mt-2 text-sm text-slate-600">{hint}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                            Las Violetas
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        <button
                            onClick={() => nav(-1)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                        >
                            Volver
                        </button>

                        <button
                            onClick={() => nav("/", { replace: true })}
                            className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-4 focus:ring-sky-100"
                        >
                            Ir al Dashboard
                        </button>
                    </div>

                    {!isRouteErrorResponse(err) && (
                        <pre className="mt-6 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                            {String((err as { message?: string })?.message ?? err)}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}
