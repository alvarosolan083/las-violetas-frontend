import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToastViewport } from "./ToastViewport";

export type ToastType = "success" | "error" | "info";

export type ToastInput = {
    type: ToastType;
    title: string;
    message?: string;
    durationMs?: number;
};

export type Toast = {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
};

type ToastContextValue = {
    showToast: (toast: ToastInput) => string;
    dismissToast: (id: string) => void;
};

const DEFAULT_TOAST_DURATION_MS = 4000;

export const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timeoutRef = useRef<Map<string, number>>(new Map());

    const dismissToast = useCallback((id: string) => {
        const timeoutId = timeoutRef.current.get(id);

        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId);
            timeoutRef.current.delete(id);
        }

        setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (toast: ToastInput) => {
            const id = createToastId();
            const { durationMs = DEFAULT_TOAST_DURATION_MS, ...toastData } = toast;

            setToasts((previous) => [{ id, ...toastData }, ...previous]);

            const timeoutId = window.setTimeout(() => {
                dismissToast(id);
            }, durationMs);

            timeoutRef.current.set(id, timeoutId);

            return id;
        },
        [dismissToast]
    );

    useEffect(() => {
        return () => {
            timeoutRef.current.forEach((timeoutId) => {
                window.clearTimeout(timeoutId);
            });
            timeoutRef.current.clear();
        };
    }, []);

    const value = useMemo(
        () => ({
            showToast,
            dismissToast,
        }),
        [showToast, dismissToast]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
}
