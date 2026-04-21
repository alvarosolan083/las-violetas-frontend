import { useMemo, useState } from "react";
import { useAnnouncements } from "../features/announcements/announcements.hooks";
import { useCreateAnnouncement } from "../features/announcements/announcements.mutations";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function AnnouncementsPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading, isError, error } = useAnnouncements(page, pageSize);

    const createMut = useCreateAnnouncement();

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const canSubmit = useMemo(() => {
        return title.trim().length >= 3 && body.trim().length >= 5;
    }, [title, body]);

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;

        try {
            await createMut.mutateAsync({ title: title.trim(), body: body.trim() });
            setTitle("");
            setBody("");
            // nos quedamos en page 1 para ver el nuevo anuncio arriba
            setPage(1);
        } catch {
            // el error ya lo muestra abajo
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">Anuncios</h1>
                <p className="text-sm text-slate-600">
                    Muro de comunicados del condominio (tipo ComunidadFeliz).
                </p>
            </div>

            <div className="rounded-xl border bg-white p-4">
                <div className="font-medium text-slate-900 mb-3">Crear anuncio</div>

                <form onSubmit={onCreate} className="grid gap-3">
                    <div className="grid gap-1">
                        <label className="text-sm text-slate-700">Título</label>
                        <input
                            className="h-10 rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Corte de agua programado"
                        />
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm text-slate-700">Contenido</label>
                        <textarea
                            className="min-h-[90px] rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Describe el comunicado..."
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={!canSubmit || createMut.isPending}
                            className={cn(
                                "h-10 rounded-lg px-4 text-sm font-medium",
                                !canSubmit || createMut.isPending
                                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                    : "bg-sky-600 text-white hover:bg-sky-700"
                            )}
                        >
                            {createMut.isPending ? "Publicando..." : "Publicar"}
                        </button>

                        {createMut.isError ? (
                            <span className="text-sm text-rose-600">
                                No se pudo crear el anuncio.
                            </span>
                        ) : null}
                    </div>
                </form>
            </div>

            <div className="rounded-xl border bg-white">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="font-medium text-slate-900">Listado</div>
                    <div className="text-sm text-slate-600">
                        Página {data?.page ?? page} de {data?.totalPages ?? 1}
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-4 text-sm text-slate-600">Cargando anuncios...</div>
                ) : isError ? (
                    <div className="p-4 text-sm text-rose-600">
                        Error cargando anuncios: {(error as Error)?.message ?? "desconocido"}
                    </div>
                ) : (
                    <div className="divide-y">
                        {data?.items?.length ? (
                            data.items.map((a) => (
                                <div key={a.id} className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="font-semibold text-slate-900">
                                                {a.title}
                                            </div>
                                            <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                                                {a.body}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-2">
                                                {a.createdBy?.name || a.createdBy?.email || "Usuario"} ·{" "}
                                                {new Date(a.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-sm text-slate-600">
                                No hay anuncios aún.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <button
                        className="h-9 rounded-lg border px-3 text-sm disabled:opacity-50"
                        disabled={(data?.page ?? page) <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Anterior
                    </button>

                    <button
                        className="h-9 rounded-lg border px-3 text-sm disabled:opacity-50"
                        disabled={(data?.page ?? page) >= (data?.totalPages ?? 1)}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}