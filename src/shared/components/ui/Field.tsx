import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export const inputClass =
  'h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-base text-ink outline-none transition placeholder:text-slate-500 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:text-sm'

export const textareaClass =
  'min-h-24 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition placeholder:text-slate-500 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:text-sm'

export const selectClass =
  'h-11 w-full appearance-none rounded-xl border border-line bg-surface px-3.5 text-base text-ink outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:text-sm'
