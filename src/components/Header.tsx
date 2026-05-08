import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Trophy, Swords, Users, LogOut, User } from 'lucide-react'
import { Button } from './Button'
import { useAuthStore } from '../stores/authStore'
import { clsx } from 'clsx'

const navItems = [
  { path: '/', label: 'Arena', icon: Swords },
  { path: '/leaderboard', label: 'Rankings', icon: Trophy },
  { path: '/friends', label: 'Squad', icon: Users },
]

export function Header() {
  const location = useLocation()
  const { isAuthenticated, profile, signOut } = useAuthStore()

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-extrabold tracking-[0.15em] uppercase">
            <span className="gradient-text">DA</span>
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all',
                    'border border-transparent hover:border-white/20 hover:bg-white/5',
                    isActive && 'border-accent/50 bg-accent/10 text-accent'
                  )}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated && profile ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 glass rounded">
                <User size={14} className="text-gray-400" />
                <span className="font-mono text-xs">{profile.username}</span>
                <span className="text-accent text-xs font-mono">●{profile.elo}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut size={14} />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm">Connect</Button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  )
}