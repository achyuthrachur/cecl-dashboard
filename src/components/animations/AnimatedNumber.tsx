'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useSpring, useTransform, useInView } from 'framer-motion'
import { formatCurrency, formatPercent, formatCompactNumber } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  format?: 'currency' | 'percent' | 'number' | 'compact'
  duration?: number
  delay?: number
  className?: string
}

export function AnimatedNumber({
  value,
  format = 'number',
  duration = 1.5,
  delay = 0,
  className = '',
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [displayValue, setDisplayValue] = useState(0)

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  })

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        spring.set(value)
      }, delay * 1000)
      return () => clearTimeout(timeout)
    }
  }, [isInView, value, spring, delay])

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest)
    })
    return unsubscribe
  }, [spring])

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percent':
        return formatPercent(val)
      case 'compact':
        return formatCompactNumber(val)
      default:
        return val.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay }}
    >
      {formatValue(displayValue)}
    </motion.span>
  )
}
