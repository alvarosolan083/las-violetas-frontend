import { useEffect } from "react";
import type { MouseEvent, ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export type ConfirmActionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    confirmTone?: "emerald" | "rose" | "sky" | "amber";
    isBusy?: boolean;
    spaceName: string;
    residentName: string;
    residentEmail: string;
    slotLabel: string;
    dateTime: string;
    statusBadge: ReactNode;
};

export function ConfirmActionModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText = "Cancelar",
    confirmTone = "emerald",
    isBusy = false,
    spaceName,
    residentName,
    residentEmail,
    slotLabel,
    dateTime,
    statusBadge,
}: ConfirmActionModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isBusy) {
            onClose();
        }
    };

    const toneMap = {
        emerald: "bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500",
        rose: "bg-rose-600 hover:bg-rose-500 focus:ring-rose-500",
        sky: "bg-sky-600 hover:bg-sky-500 focus:ring-sky-500",
        amber: "bg-amber-600 hover:bg-amber-500 focus:ring-amber-500",
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity"
            onClick={handleOverlayClick}
            aria-modal="true"
            role="dialog"
        >
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 p-6">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{message}</p>
                </div>

                <div className="bg-slate-50 p-6">
                    <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="font-medium text-slate-500">Espacio</span>
                            <span className="font-semibold text-slate-900">{spaceName}</span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="font-medium text-slate-500">Residente</span>
                            <div className="text-right">
                                <div className="font-medium text-slate-900">{residentName}</div>
                                <div className="text-xs text-slate-500">{residentEmail}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="font-medium text-slate-500">Bloque y fecha</span>
                            <div className="text-right">
                                <div className="font-medium text-slate-900">{slotLabel}</div>
                                <div className="text-xs text-slate-500">{dateTime}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="font-medium text-slate-500">Estado actual</span>
                            {statusBadge}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white p-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isBusy}
                        className={cn(
                            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            toneMap[confirmTone],
                        )}
                    >
                        {isBusy ? (
                            <>
                                <svg
                                    className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Procesando...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}