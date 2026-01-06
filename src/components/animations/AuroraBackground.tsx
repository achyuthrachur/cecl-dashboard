'use client'

import { motion } from 'framer-motion'

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

      {/* Animated orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
          top: '10%',
          left: '20%',
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20 dark:opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          top: '50%',
          right: '10%',
          filter: 'blur(60px)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15 dark:opacity-8"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
          bottom: '20%',
          left: '30%',
          filter: 'blur(50px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full opacity-15 dark:opacity-8"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
          top: '60%',
          left: '60%',
          filter: 'blur(50px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />

      {/* Subtle mesh gradient overlay */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(at 40% 20%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, rgba(16, 185, 129, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.1) 0px, transparent 50%)
          `,
        }}
      />
    </div>
  )
}

// Alternative simpler aurora effect
export function SimpleAurora() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%, rgba(139, 92, 246, 0.1) 100%)',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}
