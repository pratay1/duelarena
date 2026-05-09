import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Users, UserPlus, MessageSquare, Swords } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Loading } from '../components/Loading'
import { useAuthStore } from '../stores/authStore'
import { supabase, handleSupabaseError } from '../lib/supabase'
import { validateUUID } from '../validators'
import type { Profile, Friendship } from '../types'

export function FriendsPage() {
  const { profile } = useAuthStore()
  const [friends, setFriends] = useState<(Profile & { friendship: Friendship })[]>([])
  const [pendingRequests, setPendingRequests] = useState<(Profile & { friendship: Friendship })[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    if (!profile) return

    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
      .eq('status', 'accepted')

    if (!friendships || friendships.length === 0) {
      setIsLoading(false)
      return
    }

    const friendIds = friendships.map(f => 
      f.user_id === profile.id ? f.friend_id : f.user_id
    )

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds)

    if (profilesData) {
      const friendsWithData = profilesData.map(p => ({
        ...p,
        friendship: friendships.find(f => 
          f.user_id === profile.id ? f.friend_id === p.id : f.user_id === p.id
        )!
      }))
      setFriends(friendsWithData)
    }

    setIsLoading(false)
  }

  const searchUsers = async () => {
    if (!searchQuery || searchQuery.length < 3) return

    setIsSearching(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${searchQuery}%`)
      .limit(10)

    if (data) {
      setSearchResults(data.filter(p => p.id !== profile?.id))
    }

    setIsSearching(false)
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!profile) return

    const validation = validateUUID(friendId)
    if (!validation.success) return

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: profile.id,
          friend_id: friendId,
          status: 'pending',
        })

      if (error) throw error
      setSearchResults(prev => prev.filter(p => p.id !== friendId))
      setSearchQuery('')
    } catch (err) {
      console.error(handleSupabaseError(err))
    }
  }

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
            <Users className="text-accent" size={32} />
            <h1 className="font-display text-4xl font-extrabold uppercase tracking-wider">
              <span className="gradient-text">Squad</span>
            </h1>
          </div>
          <p className="text-center font-mono text-xs text-gray-500 tracking-wider">
            Manage your combat allies
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <UserPlus className="text-accent" size={20} />
                <h2 className="font-display text-lg font-bold uppercase tracking-wider">
                  Recruit
                </h2>
              </div>

              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search warriors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={isSearching}>
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 glass rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-mono text-xs">
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-mono text-sm">{user.username}</p>
                          <p className="font-mono text-xs text-gray-400">●{user.points}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="text-accent" size={20} />
                <h2 className="font-display text-lg font-bold uppercase tracking-wider">
                  Allies ({friends.length})
                </h2>
              </div>

              {friends.length === 0 ? (
                <p className="text-gray-500 font-mono text-sm text-center py-8">
                  No allies yet. Recruit warriors to your squad.
                </p>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 glass rounded hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-mono text-sm">
                          {friend.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-mono text-sm">{friend.username}</p>
                          <p className="font-mono text-xs text-gray-400">
                            {friend.games_played} games
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Swords size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}