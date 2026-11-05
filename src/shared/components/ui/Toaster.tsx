import { useEffect } from 'react'

import { useToastStore, type ToastItem } from '@/shared/store/toastStore'

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="print-hidden pointer-events-none fixed inset-x-0 bottom-[calc(8.75rem+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismissToast = useToastStore((state) => state.dismissToast)

  useEffect(() => {
    const timeout = window.setTimeout(() => dismissToast(toast.id), toast.duration)
    return () => window.clearTimeout(timeout)
  }, [dismissToast, toast.duration, toast.id])

  return (
    <div className="toast-enter pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-float">
      <span className="min-w-0 flex-1">{toast.message}</span>

      {toast.actionLabel && toast.onAction ? (
        <button
          type="button"
          onClick={() => {
            toast.onAction?.()
            dismissToast(toast.id)
          }}
          className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-brand-300 transition hover:bg-white/10"
        >
          {toast.actionLabel}
        </button>
      ) : null}

      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
      >
        <span aria-hidden="true" className="block text-base leading-none">
          ×
        </span>
      </button>
    </div>
  )
}
