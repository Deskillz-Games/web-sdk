// =============================================================================
// Button.tsx — packages/game-ui/src/components/ui/Button.tsx
//
// v3.1.0: All custom Tailwind tokens (neon-*, gaming-*, primary-*) replaced
// with standard Tailwind utility classes. No JIT compilation required.
// =============================================================================

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../utils'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wider rounded-lg overflow-hidden transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900'

    // All values use standard Tailwind — no neon-* gaming-* primary-* tokens
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 focus:ring-cyan-500',
      secondary:
        'bg-transparent border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20 focus:ring-cyan-500',
      ghost:
        'bg-transparent text-white/70 hover:text-cyan-400 hover:bg-white/5 focus:ring-white/20',
      danger:
        'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-lg hover:shadow-red-500/25 focus:ring-red-500',
      success:
        'bg-gradient-to-r from-green-500 to-emerald-600 text-gray-900 hover:shadow-lg hover:shadow-green-500/25 focus:ring-green-500',
    }

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    }

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        {...props}
      >
        <span className="relative flex items-center gap-2">
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            leftIcon
          )}
          {children}
          {rightIcon && !isLoading && rightIcon}
        </span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button