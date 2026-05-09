import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Trophy, Medal, Crown } from 'lucide-react'
import { Card } from '../components/Card'
import { Loading } from '../components/Loading'
import { supabase } from '../lib/supabase'
import type { Profile, LeaderboardSnapshot, RankedSeason } from '../types'

export function LeaderboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [season, setSeason] = useState<RankedSeason | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('elo', { ascending: false })
        .limit(50)

      if (profilesData) {
        setProfiles(profilesData as Profile[])
      }

      const { data: seasonData } = await supabase
        .from('ranked_seasons')
        .select('*')
        .eq('is_active', true)
        .single()

      if (seasonData) {
        setSeason(seasonData as RankedSeason)
      }

      setIsLoading(false)
    }

    fetchLeaderboard()
  }, [])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="text-accent" size={32} />
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-wider">
              <span className="gradient-text">Rankings</span>
            </h1>
          </div>
          {season && (
            <p className="text-center font-mono text-xs text-gray-500 tracking-wider">
              Season: {season.name}
            </p>
          )}
        </motion.div>

        <Card>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-mono text-gray-500 uppercase tracking-wider border-b border-white/10">
              <div className="col-span-2">Rank</div>
              <div className="col-span-6">Warrior</div>
              <div className="col-span-2 text-center">Record</div>
              <div className="col-span-2 text-right">ELO</div>
            </div>

            {profiles.slice(0, 20).map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-all
                  ${index < 3 
                    ? 'bg-gradient-to-r from-accent/10 to-transparent border border-accent/30' 
                    : 'hover:bg-white/5'
                  }
                `}
              >
                <div className="col-span-2 flex items-center">
                  {index === 0 && <Crown className="text-yellow-500" size={18} />}
                  {index === 1 && <Medal className="text-gray-300" size={18} />}
                  {index === 2 && <Medal className="text-amber-700" size={18} />}
                  {index > 2 && (
                    <span className="font-mono text-sm text-gray-400">#{index + 1}</span>
                  )}
                </div>
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-mono text-xs">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-mono text-sm">{profile.username}</span>
                </div>
                <div className="col-span-2 flex items-center justify-center font-mono text-xs text-gray-400">
                  <span className="text-green-400">{profile.games_played}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className={`font-mono text-sm font-bold ${index < 3 ? 'text-accent' : 'text-white'}`}>
                    {profile.points}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}