import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Swords, Zap, Target, Clock, Users } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Logo } from '../components/Logo'
import { Loading } from '../components/Loading'
import { useAuthStore } from '../stores/authStore'
import { supabase, handleSupabaseError } from '../lib/supabase'
import { validateMatchCreation } from '../validators'
import type { Category } from '../types'

const defaultCategories: Category[] = [
  { id: '1', name: 'General Knowledge', icon: '🧠', color: '#ff3d00' },
  { id: '2', name: 'Science', icon: '🔬', color: '#00ff88' },
  { id: '3', name: 'History', icon: '📜', color: '#ffd700' },
  { id: '4', name: 'Pop Culture', icon: '🎬', color: '#ff00ff' },
  { id: '5', name: 'Technology', icon: '💻', color: '#00ccff' },
  { id: '6', name: 'Sports', icon: '⚽', color: '#ff8800' },
]

export function LobbyPage() {
  const { isAuthenticated, profile } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentMatches, setRecentMatches] = useState<any[]>([])

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (data && data.length > 0) {
        setCategories(data)
      }
    }

    fetchCategories()
  }, [])

  const handleCreateMatch = async () => {
    if (!selectedCategory || !isAuthenticated || !profile) {
      setError('Please select a category')
      return
    }

    const validation = validateMatchCreation({ category_id: selectedCategory })
    if (!validation.success) {
      setError('Invalid match configuration')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('matches')
        .insert({
          player1_id: profile.id,
          category_id: selectedCategory,
          status: 'waiting',
          created_by: profile.id,
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (data) {
        window.location.href = `/match/${data.id}`
      }
    } catch (err) {
      const errorInfo = handleSupabaseError(err)
      setError(errorInfo.message)
    } finally {
      setIsCreating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Logo />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <Card className="max-w-md mx-auto">
              <p className="text-gray-400 text-sm font-mono mb-6">
                You must authenticate to enter the arena.
              </p>
              <a href="/auth">
                <Button className="w-full">Authenticate</Button>
              </a>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Logo />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <Target className="text-accent" size={20} />
                <h2 className="font-display text-lg font-bold uppercase tracking-wider">
                  Select Domain
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      p-4 rounded-lg border text-left transition-all
                      ${selectedCategory === category.id
                        ? 'border-accent bg-accent/10'
                        : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                      }
                    `}
                  >
                    <span className="text-2xl mb-2 block">{category.icon}</span>
                    <span className="text-xs font-mono uppercase tracking-wider">
                      {category.name}
                    </span>
                  </motion.button>
                ))}
              </div>

              {error && (
                <p className="mt-4 text-red-400 text-xs font-mono p-3 bg-red-900/20 border border-red-500/30 rounded">
                  {error}
                </p>
              )}

              <Button
                onClick={handleCreateMatch}
                disabled={!selectedCategory || isCreating}
                className="w-full mt-6"
              >
                {isCreating ? (
                  <span className="animate-pulse">Initializing...</span>
                ) : (
                  <>
                    <Swords size={16} className="mr-2" />
                    Enter Arena
                  </>
                )}
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="text-accent" size={20} />
                <h2 className="font-display text-lg font-bold uppercase tracking-wider">
                  Combat Intel
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 glass rounded">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm font-mono">Tokens</span>
                  </div>
                  <span className="text-accent font-mono text-sm">
                    {profile?.tokens || 100}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 glass rounded">
                  <div className="flex items-center gap-3">
                    <Target size={16} className="text-gray-400" />
                    <span className="text-sm font-mono">Points</span>
                  </div>
                  <span className="text-accent font-mono text-sm font-bold">
                    {profile?.points || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 glass rounded">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm font-mono">Games Played</span>
                  </div>
                  <span className="text-white font-mono text-sm font-bold">
                    {profile?.games_played || 0}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 font-mono">
                  Each match consists of 10 rounds. Answer quickly and accurately to climb the ranks.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}