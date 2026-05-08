import { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const baseStyles = clsx(
    'btn-brutal font-display tracking-[0.3em] uppercase font-extrabold',
    'border border-white/20 bg-white/5 text-white transition-all duration-150',
    'hover:bg-white/10 hover:border-white/40 hover:translate-y-[-2px]',
    'hover:shadow-[0_4px_20px_rgba(255,61,0,0.3)]',
    'active:translate-y-0 active:shadow-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
    'glitch-hover',
    {
      'px-3 py-2 text-xs': size === 'sm',
      'px-6 py-3 text-sm': size === 'md',
      'px-8 py-4 text-base': size === 'lg',
      'bg-accent/20 border-accent/40 hover:bg-accent/30': variant === 'secondary',
      'bg-transparent border-transparent hover:bg-white/5': variant === 'ghost',
    },
    className
  )

  return (
    <button
      className={baseStyles}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}