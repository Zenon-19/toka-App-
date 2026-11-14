import { AlertCircle, Bell, Check, X } from 'lucide-react';
import { useTokaStore } from '../store/useTokaStore.ts';

export function ToastBanner() {
  const toast = useTokaStore((s) => s.toast);
  const clearToast = useTokaStore((s) => s.clearToast);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 pointer-events-none flex justify-end">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] shadow-xl"
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isError
              ? 'bg-red-500/15 text-red-400'
              : isInfo
              ? 'bg-[#C6FF69]/15 text-[var(--toka-accent-text)]'
              : 'bg-[#C6FF69] text-[#121512]'
          }`}
        >
          {isError ? (
            <AlertCircle size={16} />
          ) : isInfo ? (
            <Bell size={16} />
          ) : (
            <Check size={16} strokeWidth={2.5} />
          )}
        </div>
        <p className="text-sm text-[var(--toka-text-primary)] flex-1 leading-snug">
          {toast.message}
        </p>
        <button
          type="button"
          onClick={clearToast}
          aria-label="Dismiss notification"
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)]"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
