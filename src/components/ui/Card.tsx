// =============================================================================
// Card.tsx — packages/game-ui/src/components/ui/Card.tsx
//
// v3.1.0: All custom Tailwind tokens (neon-*, gaming-*) replaced with
// standard Tailwind utility classes. No JIT compilation required.
// =============================================================================

import { forwardRef, type HTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../utils'

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glow' | 'glass' | 'bordered'
  hover?: boolean
  children: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = true, className, children, ...props }, ref) => {
    const baseStyles = 'relative rounded-xl overflow-hidden transition-all duration-300 ease-out'

    // Standard Tailwind only — no gaming-* neon-* tokens
    const variants: Record<NonNullable<CardProps['variant']>, string> = {
      default:  'bg-gray-900/50 backdrop-blur-sm border border-white/10',
      glow:     'bg-gray-900/50 backdrop-blur-sm border border-cyan-500/30',
      glass:    'bg-white/5 backdrop-blur-xl border border-white/10',
      bordered: 'bg-gray-900/30 border-2 border-white/15',
    }

    const hoverStyles = hover
      ? 'hover:border-cyan-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30'
      : ''

    return (
      <motion.div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        {...props}
      >
        <div className="relative z-10">{children}</div>
      </motion.div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4 border-b border-white/10', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4 border-t border-white/10', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardFooter }
export default Card