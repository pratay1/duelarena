import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useAnimation } from 'motion/react'
import { Timer, Trophy, XCircle, ShieldCheck, TrendingUp, AlertCircle, Zap, Sparkles, Star, History, Settings as SettingsIcon, Cpu } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { useAuthStore } from '../stores/authStore'
import { supabase, handleSupabaseError } from '../lib/supabase'
import { TRIVIA_QUESTIONS } from '../data/questions'
import { cn } from '../lib/utils'

interface LocalQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface GameState {
  questions: LocalQuestion[]
  currentQuestionIndex: number
  sessionScore: number
  status: 'idle' | 'category_selection' | 'wagering' | 'loading' | 'playing' | 'round_complete' | 'failed' | 'finished'
  timeLeft: number
  roundQuestions: number
  selectedCategory: string | null
  wager: number
  streak: number
  lifelines: {
    fiftyFifty: boolean
    skip: boolean
  }
}

const ROUND_TIME = 15

export function GamePage() {
  const navigate = useNavigate()
  const controls = useAnimation()
  const { profile, addTokens, addPoints, incrementGamesPlayed, settings } = useAuthStore()
  
  const [gameState, setGameState] = useState<GameState>({
    questions: [],
    currentQuestionIndex: 0,
    sessionScore: 0,
    status: 'idle',
    timeLeft: ROUND_TIME,
    roundQuestions: 0,
    selectedCategory: null,
    wager: 0,
    streak: 0,
    lifelines: { fiftyFifty: false, skip: false }
  })

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [disabledOptions, setDisabledOptions] = useState<number[]>([])
  const [notification, setNotification] = useState<{text: string, type: 'success' | 'warn'} | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const screenShake = async () => {
    await controls.start({
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    })
  }

  const categories = Array.from(new Set(TRIVIA_QUESTIONS.map(q => q.category))).sort()
  const currentQuestion = gameState.questions[gameState.currentQuestionIndex]

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(t)
    }
  }, [notification])

  const getLevel = (points: number) => Math.floor(Math.sqrt(points / 50)) + 1
  const level = profile ? getLevel(profile.lifetime_points) : 1

  const getXPProgress = () => {
    if (!profile) return 0
    const currentLevel = getLevel(profile.lifetime_points)
    const levelStartPoints = Math.pow(currentLevel - 1, 2) * 50
    const nextLevelPoints = Math.pow(currentLevel, 2) * 50
    const progress = ((profile.lifetime_points - levelStartPoints) / (nextLevelPoints - levelStartPoints)) * 100
    return Math.min(progress, 100)
  }

  const handleCategorySelect = (category: string) => {
    setGameState(prev => ({
      ...prev,
      selectedCategory: category,
      status: 'wagering'
    }))
  }

  const handleWager = (wager: number) => {
    if (!profile || profile.tokens < wager) {
      setNotification({ text: 'Insufficient tokens!', type: 'warn' })
      return
    }

    // Deduct tokens
    supabase
      .from('profiles')
      .update({ tokens: profile.tokens - wager })
      .eq('id', profile.id)
      .then()

    const categoryQuestions = TRIVIA_QUESTIONS
      .filter(q => q.category === gameState.selectedCategory)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)

    setGameState(prev => ({
      ...prev,
      wager,
      questions: categoryQuestions,
      status: 'playing',
      roundQuestions: 0,
      currentQuestionIndex: 0,
      timeLeft: ROUND_TIME
    }))
  }

  const handleFiftyFifty = () => {
    if (!currentQuestion || gameState.lifelines.fiftyFifty) return

    const correctIndex = currentQuestion.correctAnswer
    const wrongIndices = currentQuestion.options
      .map((_, i) => i)
      .filter(i => i !== correctIndex)
    
    const toDisable = wrongIndices
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)

    setDisabledOptions(toDisable)
    setGameState(prev => ({
      ...prev,
      lifelines: { ...prev.lifelines, fiftyFifty: true }
    }))
  }

  const handleSkip = () => {
    if (!currentQuestion || gameState.lifelines.skip) return

    setGameState(prev => ({
      ...prev,
      lifelines: { ...prev.lifelines, skip: true },
      status: 'loading'
    }))

    setTimeout(() => {
      handleNextQuestion()
    }, 1000)
  }

  const handleAnswerSelect = useCallback((index: number) => {
    if (selectedAnswer !== null || !currentQuestion) return
    
    const correct = index === currentQuestion.correctAnswer
    
    setSelectedAnswer(index)
    setIsCorrect(correct)

    if (correct) {
      const streakBonus = Math.min(gameState.streak * 10, 50)
      const points = (gameState.timeLeft * 5) + 50 + streakBonus
      
      setGameState(prev => ({
        ...prev,
        sessionScore: prev.sessionScore + points,
        streak: prev.streak + 1
      }))
    } else {
      setGameState(prev => ({
        ...prev,
        streak: 0
      }))
      screenShake()
    }

    // Move to next after delay
    setTimeout(() => {
      handleNextQuestion()
    }, 1500)
  }, [selectedAnswer, currentQuestion, gameState.timeLeft, gameState.streak])

  const handleNextQuestion = useCallback(() => {
    setGameState(prev => {
      const nextIndex = prev.currentQuestionIndex + 1
      const nextRoundCount = prev.roundQuestions + 1

      // Completed a round of 5
      if (nextRoundCount === 5) {
        // Award tokens for free rounds
        if (prev.wager === 0) {
          addTokens(100)
        }

        return {
          ...prev,
          roundQuestions: 0,
          currentQuestionIndex: nextIndex,
          status: 'round_complete',
          streak: prev.streak,
          lifelines: { fiftyFifty: false, skip: false }
        }
      }

      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        roundQuestions: nextRoundCount,
        timeLeft: ROUND_TIME,
        status: 'playing'
      }
    })
    setSelectedAnswer(null)
    setIsCorrect(null)
    setDisabledOptions([])
  }, [])

  // Timer
  useEffect(() => {
    if (gameState.status !== 'playing') return

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          // Time's up - treat as wrong answer
          handleAnswerSelect(-1)
          return { ...prev, timeLeft: 0, streak: 0 }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.status])

  const handlePlayAgain = async () => {
    await incrementGamesPlayed()
    
    setGameState({
      questions: [],
      currentQuestionIndex: 0,
      sessionScore: 0,
      status: 'category_selection',
      timeLeft: ROUND_TIME,
      roundQuestions: 0,
      selectedCategory: null,
      wager: 0,
      streak: 0,
      lifelines: { fiftyFifty: false, skip: false }
    })
    setSelectedAnswer(null)
    setIsCorrect(null)
    setDisabledOptions([])
  }

  const handleRecharge = async () => {
    if (!profile) return
    
    await supabase
      .from('profiles')
      .update({ tokens: 100, last_active: new Date().toISOString() })
      .eq('id', profile.id)
  }

  // Status: IDLE - Show start button
  if (gameState.status === 'idle') {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-wider italic glitch-text mb-4">
              READY TO <span className="gradient-text">DUEL</span>?
            </h1>
            <p className="text-neutral-500 font-mono text-sm tracking-wider">
              Select a category to begin
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setGameState(prev => ({ ...prev, status: 'category_selection' }))}
            className="minimal-button mx-auto block"
          >
            <Cpu size={16} className="inline mr-2" />
            Start Duel
          </motion.button>

          {profile && profile.tokens <= 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 text-center"
            >
              <p className="text-red-400 text-xs font-mono mb-4">OUT OF TOKENS</p>
              <button onClick={handleRecharge} className="text-[10px] uppercase tracking-widest font-bold underline decoration-white/20">
                Recharge (Free 100)
              </button>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  // Status: CATEGORY SELECTION
  if (gameState.status === 'category_selection') {
    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">
              Select Domain
            </h2>
            <p className="text-neutral-500 font-mono text-xs">
              Choose your arena
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategorySelect(category)}
                className="p-6 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all text-center group"
              >
                <div className="text-2xl mb-2">{category.slice(0, 1)}</div>
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 group-hover:text-white">
                  {category}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Status: WAGERING
  if (gameState.status === 'wagering') {
    const tokenOptions = [0, 10, 25, 50, 100].filter(t => t <= (profile?.tokens || 0))

    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">
              Place Your Wager
            </h2>
            <p className="text-neutral-500 font-mono text-xs">
              {gameState.selectedCategory} • 5 Questions
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {tokenOptions.map((wager) => (
              <motion.button
                key={wager}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleWager(wager)}
                className={`
                  px-8 py-4 rounded-lg border transition-all font-display font-bold uppercase tracking-wider
                  ${wager === 0 
                    ? 'border-white/20 bg-white/5 hover:bg-white/10' 
                    : 'border-accent/50 bg-accent/10 hover:bg-accent/20'
                  }
                `}
              >
                {wager === 0 ? 'Free Play' : `${wager} Tokens`}
              </motion.button>
            ))}
          </div>

          <p className="text-center text-neutral-600 text-xs font-mono">
            Free plays award 100 tokens on completion
          </p>
        </div>
      </div>
    )
  }

  // Status: ROUND COMPLETE
  if (gameState.status === 'round_complete') {
    const tokensEarned = gameState.wager > 0 
      ? gameState.sessionScore + gameState.wager 
      : 100

    return (
      <div className="min-h-screen bg-black pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Trophy size={64} className="mx-auto mb-6 text-accent" />
            <h2 className="font-display text-3xl font-bold uppercase tracking-wider mb-4">
              Round Complete
            </h2>
            
            <div className="glass rounded-lg p-6 mb-8 max-w-xs mx-auto">
              <div className="flex justify-between mb-4">
                <span className="text-neutral-500 text-xs font-mono">Score</span>
                <span className="text-white font-display font-bold">{gameState.sessionScore}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-neutral-500 text-xs font-mono">Streak</span>
                <span className="text-accent font-display font-bold">🔥 {gameState.streak}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-white/10">
                <span className="text-neutral-500 text-xs font-mono">Tokens Earned</span>
                <span className="text-green-400 font-display font-bold">+{tokensEarned}</span>
              </div>
            </div>

            <Button onClick={handlePlayAgain}>
              Play Again
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Status: PLAYING - Show question
  if (gameState.status === 'playing' && currentQuestion) {
    return (
      <motion.div 
        className="min-h-screen bg-black pt-24 pb-12 px-4"
        animate={controls}
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    i < gameState.roundQuestions ? "bg-green-500" :
                    i === gameState.roundQuestions ? "bg-accent animate-pulse" :
                    "bg-white/20"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-neutral-500 font-mono uppercase">Streak</span>
                <span className="text-accent font-mono text-sm font-bold">🔥{gameState.streak}</span>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded",
                gameState.timeLeft <= 5 ? "bg-red-500/20 text-red-400" : "glass"
              )}>
                <Timer size={14} />
                <span className="font-mono text-lg font-bold">{gameState.timeLeft}</span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <div className="text-center mb-8">
              <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                {currentQuestion.category}
              </span>
              <p className="font-display text-xl font-bold mt-2">
                {currentQuestion.text}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index
                const isCorrectAnswer = index === currentQuestion.correctAnswer
                const showCorrect = selectedAnswer !== null && isCorrectAnswer
                const showWrong = isSelected && !isCorrectAnswer
                const isDisabled = disabledOptions.includes(index)

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null || isDisabled}
                    className={cn(
                      "p-4 rounded-lg border text-left font-mono text-sm transition-all",
                      isDisabled && "opacity-30",
                      isSelected && !showCorrect && !showWrong && "border-accent bg-accent/20",
                      showCorrect && "border-green-500 bg-green-500/20",
                      showWrong && "border-red-500 bg-red-500/20",
                      !isSelected && !showCorrect && !showWrong && !isDisabled && "border-white/10 hover:border-white/30 hover:bg-white/5"
                    )}
                  >
                    <span className="text-neutral-400 mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Lifelines */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleFiftyFifty}
              disabled={gameState.lifelines.fiftyFifty || selectedAnswer !== null}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded border text-xs font-mono uppercase tracking-wider transition-all",
                gameState.lifelines.fiftyFifty 
                  ? "border-white/10 text-white/30 cursor-not-allowed" 
                  : "border-white/20 hover:bg-white/10"
              )}
            >
              <Zap size={14} />
              50:50
            </button>
            <button
              onClick={handleSkip}
              disabled={gameState.lifelines.skip || selectedAnswer !== null}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded border text-xs font-mono uppercase tracking-wider transition-all",
                gameState.lifelines.skip
                  ? "border-white/10 text-white/30 cursor-not-allowed"
                  : "border-white/20 hover:bg-white/10"
              )}
            >
              <Sparkles size={14} />
              Skip
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return null
}