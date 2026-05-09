import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Trophy, Swords, Users, LogOut, Gamepad2 } from 'lucide-react'
import { Button } from './Button'
import { useAuthStore } from '../stores/authStore'
import { clsx } from 'clsx'

const navItems = [
  { path: '/', label: 'Duel', icon: Swords },
  { path: '/leaderboard', label: 'Rankings', icon: Trophy },
  { path: '/friends', label: 'Squad', icon: Users },
]

export function Header() {
  const location = useLocation()
  const { isAuthenticated, profile, signOut, settings } = useAuthStore()

  const getLevel = (points: number) => Math.floor(Math.sqrt(points / 50)) + 1

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5 py-4 sm:py-6 px-4 sm:px-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 sm:gap-6"
        >
          <Link to="/">
            <h1 className="text-xs sm:text-sm font-display font-black tracking-[0.4em] uppercase italic glitch-text">
              DUEL<span className="opacity-20">ARENA</span>
            </h1>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 sm:gap-8"
        >
          {isAuthenticated ? (
            <div className="flex items-center gap-4 sm:gap-10">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] sm:text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-none">Tokens</span>
                  <span className="text-[10px] sm:text-xs font-black tracking-tighter text-white">
                    {profile?.tokens?.toLocaleString() || 0} 
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-white/5 hidden sm:block" />
                <div className="flex flex-col items-end">
                  <span className="text-[8px] sm:text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-none">Player</span>
                  <span className="text-[10px] sm:text-xs font-medium tracking-tight uppercase max-w-[100px] truncate">
                    {profile?.username || 'Player'}
                  </span>
                </div>
                {profile && (
                  <>
                    <div className="h-6 w-[1px] bg-white/5 hidden sm:block" />
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] sm:text-[10px] font-bold text-neutral-600 uppercase tracking-widest leading-none">Level</span>
                      <span className="text-[10px] sm:text-xs font-black tracking-tighter text-white">
                        {getLevel(profile.lifetime_points)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={signOut}
                className="text-neutral-600 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <Link to="/auth">
              <button className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold underline decoration-white/20 underline-offset-8 hover:decoration-white transition-all">
                Log In
              </button>
            </Link>
          )}
        </motion.div>
      </div>
    </header>
  )
}