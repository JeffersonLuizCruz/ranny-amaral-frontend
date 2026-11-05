import type { ButtonHTMLAttributes, ReactNode } from 'react'

import {
  buttonBase,
  buttonClasses,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from '@/shared/components/ui/buttonStyles'
import { cn } from '@/shared/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, cn(fullWidth && 'w-full', className))}
      {...props}
    >
      {children}
    </button>
  )
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string
  children: ReactNode
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

export function IconButton({
  label,
  children,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        'shrink-0 rounded-full p-0',
        size === 'sm' ? 'size-8' : 'size-9',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
