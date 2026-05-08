import { motion } from 'motion/react'

export function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="text-center"
    >
      <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-[0.2em] uppercase">
        <span className="gradient-text">Duel</span>
        <span className="text-white">Arena</span>
      </h1>
      <p className="font-mono text-xs md:text-sm text-gray-500 mt-2 tracking-[0.3em] uppercase">
        High-Stakes Trivia Combat
      </p>
    </motion.div>
  )
}