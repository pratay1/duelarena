import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { Header } from './components/Header'
import { LoadingScreen } from './components/Loading'
import { AuthPage } from './pages/AuthPage'
import { LobbyPage } from './pages/LobbyPage'
import { MatchPage } from './pages/MatchPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { FriendsPage } from './pages/FriendsPage'
import { GamePage } from './pages/GamePage'
import { useAuthStore } from './stores/authStore'
import { supabase } from './lib/supabase'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

function AppContent() {
  const { setUser, setLoading, fetchProfile, settings } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Apply settings to document
    document.documentElement.classList.toggle('no-scanlines', !settings.scanlines)
    document.documentElement.classList.toggle('no-glitch', !settings.glitch)
    
    const themes = ['amber', 'cyan', 'green', 'red']
    themes.forEach(t => document.documentElement.classList.toggle(`theme-${t}`, settings.theme === t))
  }, [settings])

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        await fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    // Play startup sequence for 3 seconds
    const timer = setTimeout(() => {
      setInitializing(false)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const { isAuthenticated, isLoading, profile } = useAuthStore()

  if (isLoading || initializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 overflow-hidden relative">
        <div className="noise-overlay" />
        
        <div className="space-y-6 text-center relative z-10">
          <div 
            className="w-1 h-1 bg-white mx-auto shadow-[0_0_20px_rgba(255,255,255,1)]"
            style={{ animation: 'scale-pulse 2s infinite' }}
          />
          
          <div className="space-y-2">
            <h1 className="text-[10px] font-display font-black tracking-[0.8em] uppercase italic text-white/40">
              DUEL<span className="text-white">ARENA</span>
            </h1>
            <div className="flex gap-1 justify-center">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-[2px] w-4 bg-white/20 overflow-hidden"
                >
                  <div 
                    className="h-full w-2 bg-white"
                    style={{ 
                      animation: 'slide 1.5s infinite linear',
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 overflow-hidden h-4">
            <p className="text-[8px] font-mono tracking-[0.3em] text-neutral-600 uppercase">
              Connecting to server...
            </p>
          </div>
        </div>

        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px' 
          }} 
        />

        <style>{`
          @keyframes scale-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.5); }
          }
          @keyframes slide {
            0% { transform: translateX(-16px); }
            100% { transform: translateX(16px); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <Layout>
      <Header />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        } />
        <Route path="/match/:matchId" element={
          <ProtectedRoute>
            <MatchPage />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        } />
        <Route path="/friends" element={
          <ProtectedRoute>
            <FriendsPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  )
}