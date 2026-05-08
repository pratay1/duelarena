import { motion } from 'motion/react'

export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-2 border-white/20 border-t-accent rounded-full"
      />
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-6 border-2 border-white/20 border-t-accent rounded-full"
        />
        <p className="font-mono text-xs text-gray-500 tracking-[0.3em] uppercase animate-pulse">
          Initializing
        </p>
      </div>
    </div>
  )
}