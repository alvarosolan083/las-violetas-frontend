import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";
import type { Toast } from "./ToastProvider";

type ToastViewportProps = {
    toasts: Toast[];
    onDismiss: (id: string) => void;
};

const TOAST_STYLES: Record<Toast["type"], string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    error: "border-rose-200 bg-rose-50 text-rose-950",
    info: "border-sky-200 bg-sky-50 text-sky-950",
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
    if (!toasts.length) return null;

    return (
        <div
            aria-atomic="false"
            aria-live="polite"
            className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(92vw,26rem)] flex-col gap-3"
        >
            {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastCard({
    toast,
    onDismiss,
}: {
    toast: Toast;
    onDismiss: (id: string) => void;
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            setIsVisible(true);
        });

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <article
            role={toast.type === "error" ? "alert" : "status"}
            className={cn(
                "pointer-events-auto rounded-2xl border p-4 shadow-md transition-all duration-300 ease-out",
                TOAST_STYLES[toast.type],
                isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            )}
        >
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                    {toast.message ? (
                        <p className="mt-1 text-sm leading-5 text-slate-700">{toast.message}</p>
                    ) : null}
                </div>

                <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    className="rounded-lg px-2 py-1 text-base leading-none text-slate-500 transition hover:bg-white/70 hover:text-slate-700"
                    aria-label="Cerrar notificación"
                >
                    ×
                </button>
            </div>
        </article>
    );
}
