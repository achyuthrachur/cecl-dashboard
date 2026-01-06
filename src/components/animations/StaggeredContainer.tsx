'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
}

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
}

export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
}

interface StaggeredContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  staggerDelay?: number
}

export function StaggeredContainer({
  children,
  className = '',
  delay = 0,
  staggerDelay = 0.1,
}: StaggeredContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

interface StaggeredItemProps {
  children: ReactNode
  className?: string
}

export function StaggeredItem({ children, className = '' }: StaggeredItemProps) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}

// Motion wrapper for individual items with custom variants
interface MotionWrapperProps {
  children: ReactNode
  className?: string
  variants?: Variants
  whileHover?: object
  whileTap?: object
}

export function MotionWrapper({
  children,
  className = '',
  variants = itemVariants,
  whileHover,
  whileTap,
}: MotionWrapperProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      whileHover={whileHover}
      whileTap={whileTap}
    >
      {children}
    </motion.div>
  )
}
