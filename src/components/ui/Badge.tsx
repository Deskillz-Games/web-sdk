// =============================================================================
// Badge.tsx — packages/game-ui/src/components/ui/Badge.tsx
//
// v3.1.0: All custom Tailwind tokens (neon-*, gaming-*) replaced with
// standard Tailwind utility classes. No JIT compilation required.
// =============================================================================

import { type HTMLAttributes } from 'react'
import { cn } from '../../utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  glow?: boolean
}

export default function Badge({
  variant = 'default',
  size = 'md',
  pulse = false,
  glow = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 font-semibold uppercase tracking-wider rounded-full'

  // All values use standard Tailwind — no neon-* or gaming-* custom tokens
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-white/10 text-white/80',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    danger:  'bg-red-500/20 text-red-400 border border-red-500/30',
    info:    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    premium: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  }

  const sizes: Record<NonNullable<BadgeProps['size']>, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }

  // Pulse dot color maps to standard Tailwind color names
  const dotColor: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-white',
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    danger:  'bg-red-400',
    info:    'bg-cyan-400',
    premium: 'bg-yellow-400',
  }

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              dotColor[variant],
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              dotColor[variant],
            )}
          />
        </span>
      )}
      {children}
    </span>
  )
}