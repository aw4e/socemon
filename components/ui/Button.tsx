'use client'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

/* Chunky game button: a solid face on a darker 4px base that it sinks into when pressed. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 select-none cursor-pointer rounded-2xl',
          'font-sans font-extrabold uppercase tracking-[0.05em] transition-[transform,box-shadow,filter] duration-100',
          size === 'sm' && 'h-9 px-4 text-[12px]',
          size === 'md' && 'h-12 px-6 text-[14px]',
          size === 'lg' && 'h-14 px-8 text-[15px]',
          variant === 'primary' && 'bg-primary text-primary-fg shadow-[0_4px_0_var(--primary-shadow)] hover:brightness-110',
          variant === 'secondary' && 'bg-bg-elevated text-text-primary border-2 border-(--border-default) shadow-[0_4px_0_var(--border-default)]',
          variant === 'ghost' && 'bg-transparent text-text-accent hover:bg-[var(--fill)]',
          variant === 'destructive' && 'bg-sys-error text-white shadow-[0_4px_0_#B83245]',
          variant !== 'ghost' && !isDisabled && 'active:translate-y-1 active:shadow-none',
          'disabled:opacity-45 disabled:cursor-not-allowed',
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
