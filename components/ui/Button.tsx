'use client'
import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { springSnappy } from '@/lib/motion'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <motion.div
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        transition={springSnappy}
        style={fullWidth ? { width: '100%' } : undefined}
      >
        <button
          ref={ref}
          disabled={isDisabled}
          className={cn(
            'relative inline-flex items-center justify-center gap-2 select-none cursor-pointer',
            'font-sans font-medium tracking-[-0.01em] rounded-full',
            'transition-[background-color,opacity,border-color] duration-200',
            size === 'sm' && 'h-9 px-4 text-[13px]',
            size === 'md' && 'h-11 px-6 text-[15px]',
            size === 'lg' && 'h-[52px] px-8 text-[16px]',
            variant === 'primary' && 'bg-primary text-primary-fg shadow-[var(--shadow-accent)] hover:opacity-90',
            variant === 'secondary' && 'bg-transparent text-text-primary border border-(--border-default) hover:bg-[var(--fill)]',
            variant === 'ghost' && 'bg-transparent text-text-accent hover:bg-[var(--accent-primary-dim)]',
            variant === 'destructive' && 'bg-sys-error text-white hover:opacity-90',
            'disabled:opacity-40',
            fullWidth && 'w-full',
            isDisabled && 'cursor-not-allowed',
            className,
          )}
          {...props}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {children}
        </button>
      </motion.div>
    )
  },
)

Button.displayName = 'Button'
