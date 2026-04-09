import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, X, Undo2 } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  exiting?: boolean;
  onUndo?: () => void;
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error', onUndo?: () => void) => void;
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

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success', onUndo?: () => void) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, onUndo }]);
    setTimeout(() => dismiss(id), onUndo ? 5000 : 3000);
  }, [dismiss]);

  return (
    <ToastContext value={{ toast }}>
      {children}
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
            {t.onUndo && (
              <button
                onClick={() => { t.onUndo?.(); dismiss(t.id); }}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/20 cursor-pointer transition-colors"
              >
                <Undo2 className="h-3 w-3" /> Desfazer
              </button>
            )}
            <button onClick={() => dismiss(t.id)} className="shrink-0 cursor-pointer text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
