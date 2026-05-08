import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card } from '../components/Card'
import { useAuthStore } from '../stores/authStore'
import { supabase, handleSupabaseError } from '../lib/supabase'

export function AuthPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const { setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        })

        if (signUpError) throw signUpError
        if (!data.user) throw new Error('Registration failed')

        setUser({ id: data.user.id, email })
        navigate('/')
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
        if (!data.user) throw new Error('Login failed')

        setUser({ id: data.user.id, email: data.user.email || '' })
        navigate('/')
      }
    } catch (err) {
      const errorInfo = handleSupabaseError(err)
      setError(errorInfo.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="noise-overlay" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-12">
          <Logo />
        </div>

        <Card>
          <h2 className="font-display text-xl font-bold uppercase tracking-[0.2em] mb-8 text-center">
            {mode === 'login' ? 'Access Terminal' : 'Initialize'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <Input
                label="Callsign"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Passcode"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error && (
              <p className="text-red-400 text-xs font-mono p-3 bg-red-900/20 border border-red-500/30 rounded">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="animate-pulse">Processing...</span>
              ) : mode === 'login' ? (
                'Authenticate'
              ) : (
                'Register'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-gray-400 hover:text-white transition-colors font-mono tracking-wider"
            >
              {mode === 'login' ? (
                <>New here? <span className="text-accent">Initialize</span></>
              ) : (
                <>Already registered? <span className="text-accent">Access</span></>
              )}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}