'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type HoverEffect = 'lift' | 'glow' | 'border' | 'scale' | 'none'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  animated?: boolean
  hoverEffect?: HoverEffect
  delay?: number
}

const hoverEffectClasses: Record<HoverEffect, string> = {
  lift: 'card-hover-lift',
  glow: 'card-interactive',
  border: 'gradient-border',
  scale: 'hover-scale',
  none: '',
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10
    }
  }
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, animated = false, hoverEffect = 'none', delay = 0, ...props }, ref) => {
    const baseClasses = cn(
      'rounded-xl border bg-card text-card-foreground shadow',
      glass && 'glass-card',
      hoverEffectClasses[hoverEffect],
      className
    )

    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={baseClasses}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={hoverEffect !== 'none' ? 'hover' : undefined}
          transition={{ delay }}
          {...(props as HTMLMotionProps<'div'>)}
        />
      )
    }

    return (
      <div
        ref={ref}
        className={baseClasses}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
