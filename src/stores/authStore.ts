import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Profile, Settings } from '../types'

interface AuthState {
  user: { id: string; email: string } | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  settings: Settings
  setUser: (user: { id: string; email: string } | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  updateProfile: (updates: Partial<Profile>) => void
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateSettings: (settings: Partial<Settings>) => void
  addTokens: (amount: number) => Promise<void>
  addPoints: (amount: number) => Promise<void>
  incrementGamesPlayed: () => Promise<void>
}

const defaultSettings: Settings = {
  scanlines: true,
  glitch: true,
  animations: 'normal',
  difficulty: 'all',
  theme: 'amber'
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  settings: defaultSettings,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  updateProfile: (updates) => {
    const { profile } = get()
    if (profile) {
      set({ profile: { ...profile, ...updates } })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, isAuthenticated: false })
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch profile:', error)
      return
    }

    set({ profile: data as Profile })
  },

  updateSettings: (newSettings) => {
    const { settings } = get()
    const updated = { ...settings, ...newSettings }
    set({ settings: updated })
    localStorage.setItem('duel_settings', JSON.stringify(updated))
  },

  addTokens: async (amount: number) => {
    const { profile } = get()
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update({ tokens: profile.tokens + amount })
      .eq('id', profile.id)

    if (!error) {
      set({ profile: { ...profile, tokens: profile.tokens + amount } })
    }
  },

  addPoints: async (amount: number) => {
    const { profile } = get()
    if (!profile) return

    const newPoints = profile.points + amount
    const newLifetimePoints = profile.lifetime_points + amount
    const newLevel = Math.floor(Math.sqrt(newLifetimePoints / 50)) + 1

    const { error } = await supabase
      .from('profiles')
      .update({ 
        points: newPoints,
        lifetime_points: newLifetimePoints,
        level: newLevel
      })
      .eq('id', profile.id)

    if (!error) {
      set({ 
        profile: { 
          ...profile, 
          points: newPoints, 
          lifetime_points: newLifetimePoints,
          level: newLevel
        } 
      })
    }
  },

  incrementGamesPlayed: async () => {
    const { profile } = get()
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update({ games_played: profile.games_played + 1 })
      .eq('id', profile.id)

    if (!error) {
      set({ profile: { ...profile, games_played: profile.games_played + 1 } })
    }
  },
}))

// Load settings from localStorage on init
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('duel_settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      useAuthStore.setState({ settings: { ...defaultSettings, ...parsed } })
    } catch {}
  }
}