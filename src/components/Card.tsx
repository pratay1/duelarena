import { ReactNode } from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={clsx(
        'glass rounded-lg p-6',
        hover && 'transition-all duration-200 hover:bg-white/5 hover:border-white/20 hover:translate-y-[-2px]',
        className
      )}
    >
      {children}
    </motion.div>
  )
}