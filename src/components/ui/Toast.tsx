import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  exiting?: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <ToastContext value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 pointer-events-none w-[90vw] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl ${
              t.exiting ? 'animate-toast-out' : 'animate-toast-in'
            } ${
              t.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
                : 'border-red-500/30 bg-red-950/80 text-red-200'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="shrink-0 cursor-pointer text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
