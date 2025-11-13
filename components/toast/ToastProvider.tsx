"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./ToastProvider.module.css";

export type ToastType = "success" | "error" | "info";

export interface ShowToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface Toast extends Required<ShowToastOptions> {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastIdCounter = 0;

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = "info", duration = 5000 }: ShowToastOptions) => {
      setToasts((previous) => {
        const nextToast: Toast = {
          id: ++toastIdCounter,
          message,
          type,
          duration,
        };

        return [nextToast, ...previous].slice(0, 5);
      });
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onDismiss, toast.duration, toast.id]);

  const role = toast.type === "error" ? "alert" : "status";
  const ariaLive = toast.type === "error" ? "assertive" : "polite";

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]}`}
      role={role}
      aria-live={ariaLive}
    >
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => onDismiss(toast.id)}
        aria-label="Toast schließen"
      >
        <i className="bi bi-x-lg" aria-hidden />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

