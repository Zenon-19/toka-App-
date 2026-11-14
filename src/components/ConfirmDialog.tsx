import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h3
            id="confirm-dialog-title"
            className="text-lg font-semibold text-[var(--toka-text-primary)]"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close dialog"
            className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-xl text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-[var(--toka-text-secondary)]">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0 disabled:opacity-60 ${
              destructive
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-[#C6FF69] text-[#121512] hover:brightness-95'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
