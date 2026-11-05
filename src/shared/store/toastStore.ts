import { create } from 'zustand'

export interface ToastItem {
  id: string
  message: string
  actionLabel?: string
  onAction?: () => void
  duration: number
}

interface ToastOptions {
  actionLabel?: string
  onAction?: () => void
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (message: string, options?: ToastOptions) => string
  dismissToast: (id: string) => void
}

let toastCounter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, options) => {
    const id = `toast_${Date.now()}_${toastCounter++}`
    const toast: ToastItem = {
      id,
      message,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      duration: options?.duration ?? (options?.actionLabel ? 10_000 : 4_000),
    }

    set((state) => ({ toasts: [...state.toasts.slice(-2), toast] }))
    return id
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },
}))
