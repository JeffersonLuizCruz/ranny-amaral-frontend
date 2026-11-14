import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { inputClass } from '@/shared/components/ui/Field'
import { cn } from '@/shared/lib/cn'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/**
 * Campo de senha com botao para alternar a visibilidade.
 *
 * O botao e type="button" para nao disparar o submit do formulario.
 */
export function PasswordInput({
  className,
  style,
  disabled,
  ...props
}: PasswordInputProps) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        disabled={disabled}
        type={visivel ? 'text' : 'password'}
        className={cn(inputClass, className)}
        style={{ paddingRight: '2.75rem', ...style }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visivel}
        title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={() => setVisivel((atual) => !atual)}
        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-40"
      >
        {visivel ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
