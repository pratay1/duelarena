import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Timer, CheckCircle, XCircle, Swords, Trophy } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Loading } from '../components/Loading'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { supabase, handleSupabaseError, isUUID } from '../lib/supabase'
import type { Match, MatchRound, TriviaQuestion, Answer, PlayerAnswer } from '../types'

const ROUND_TIME = 15
const TOTAL_ROUNDS = 10

export function MatchPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const {
    match,
    rounds,
    currentRound,
    playerAnswers,
    setMatch,
    setRounds,
    setCurrentRound,
    setAnswersForQuestion,
    addPlayerAnswer,
    resetGame,
  } = useGameStore()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null)
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>([])
  const [winner, setWinner] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(ROUND_TIME)

  useEffect(() => {
    if (!matchId || !isUUID(matchId)) {
      setError('Invalid match ID')
      setIsLoading(false)
      return
    }

    async function fetchMatch() {
      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError) {
        setError('Match not found')
        setIsLoading(false)
        return
      }

      setMatch(data as Match)
      
      if (data.status === 'completed') {
        setWinner(data.winner_id)
        setIsLoading(false)
        return
      }

      const { data: roundsData } = await supabase
        .from('match_rounds')
        .select('*')
        .eq('match_id', matchId)
        .order('round_number')

      if (roundsData) {
        setRounds(roundsData as MatchRound[])
        const activeRound = roundsData.find((r: MatchRound) => r.status === 'active') as MatchRound | undefined
        if (activeRound) {
          setCurrentRound(activeRound)
          loadQuestion(activeRound.question_id)
        }
      }

      setIsLoading(false)
    }

    fetchMatch()

    return () => {
      resetGame()
    }
  }, [matchId])

  useEffect(() => {
    if (!currentRound || hasAnswered) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentRound, hasAnswered])

  const loadQuestion = async (questionId: string) => {
    const { data: question } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (question) {
      setCurrentQuestion(question as TriviaQuestion)
    }

    const { data: answersData } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)

    if (answersData) {
      setCurrentAnswers(answersData as Answer[])
      setAnswersForQuestion(questionId, answersData as Answer[])
    }
  }

  const handleTimeout = async () => {
    if (!currentRound || !profile) return
    await submitAnswer('')
  }

  const submitAnswer = async (answerId: string) => {
    if (!currentRound || !profile || hasAnswered || !currentQuestion) return

    setHasAnswered(true)
    const isCorrect = answerId === currentQuestion.correct_answer_id
    const responseTime = (ROUND_TIME - timeRemaining) * 1000

    try {
      const { data, error } = await supabase
        .from('player_answers')
        .insert({
          round_id: currentRound.id,
          player_id: profile.id,
          answer_id: answerId || '00000000-0000-0000-0000-000000000000',
          is_correct: isCorrect,
          response_time_ms: responseTime,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        addPlayerAnswer(data as PlayerAnswer)
      }

      setShowResult(true)

      setTimeout(async () => {
        await moveToNextRound()
      }, 2000)
    } catch (err) {
      const errorInfo = handleSupabaseError(err)
      setError(errorInfo.message)
    }
  }

  const moveToNextRound = async () => {
    if (!matchId || !currentRound) return

    const currentRoundIndex = rounds.findIndex(r => r.id === currentRound.id)
    const nextRound = rounds[currentRoundIndex + 1]

    if (nextRound) {
      setCurrentRound(nextRound)
      setHasAnswered(false)
      setShowResult(false)
      setSelectedAnswer(null)
      setTimeRemaining(ROUND_TIME)
      await loadQuestion(nextRound.question_id)
    } else {
      await completeMatch()
    }
  }

  const completeMatch = async () => {
    if (!matchId || !profile) return

    const playerAnswerCount = playerAnswers.filter(a => a.is_correct).length
    const isWinner = playerAnswerCount > 5

    await supabase
      .from('matches')
      .update({
        status: 'completed',
        winner_id: isWinner ? profile.id : match?.player2_id,
        player1_score: playerAnswerCount,
        player2_score: 10 - playerAnswerCount,
      })
      .eq('id', matchId)

    setWinner(isWinner ? profile.id : match?.player2_id || null)
  }

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card>
          <p className="text-red-400 font-mono text-sm mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>Return to Lobby</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Swords className="text-accent" size={24} />
              <div>
                <h1 className="font-display text-2xl font-bold uppercase tracking-wider">
                  Match Arena
                </h1>
                <p className="font-mono text-xs text-gray-400">
                  Round {rounds.findIndex(r => r.id === currentRound?.id) + 1 || 1} / {TOTAL_ROUNDS}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg">
              <Timer className={`${timeRemaining <= 5 ? 'text-red-500 animate-pulse' : 'text-accent'}`} size={20} />
              <span className={`font-mono text-xl font-bold ${timeRemaining <= 5 ? 'text-red-500' : 'text-white'}`}>
                {timeRemaining}
              </span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {winner ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="text-center py-12">
                <Trophy size={64} className="mx-auto mb-6 text-accent" />
                <h2 className="font-display text-3xl font-bold uppercase tracking-wider mb-4">
                  {winner === profile?.id ? 'Victory' : 'Defeat'}
                </h2>
                <p className="text-gray-400 font-mono text-sm mb-8">
                  {winner === profile?.id 
                    ? 'You have conquered this duel!' 
                    : 'Better luck next time, warrior.'}
                </p>
                <Button onClick={() => navigate('/')}>Return to Lobby</Button>
              </Card>
            </motion.div>
          ) : currentQuestion && (
            <motion.div
              key={currentRound?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-6">
                <p className="font-display text-lg font-bold text-center mb-8">
                  {currentQuestion.question_text}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {currentAnswers.map((answer) => {
                    const isSelected = selectedAnswer === answer.id
                    const isCorrect = answer.id === currentQuestion.correct_answer_id
                    const showAsCorrect = showResult && isCorrect
                    const showAsWrong = showResult && isSelected && !isCorrect

                    return (
                      <button
                        key={answer.id}
                        onClick={() => {
                          if (!hasAnswered) {
                            setSelectedAnswer(answer.id)
                            submitAnswer(answer.id)
                          }
                        }}
                        disabled={hasAnswered}
                        className={`
                          p-4 rounded-lg border text-left transition-all font-mono text-sm
                          ${isSelected && !showResult
                            ? 'border-accent bg-accent/20'
                            : showAsCorrect
                              ? 'border-green-500 bg-green-500/20'
                              : showAsWrong
                                ? 'border-red-500 bg-red-500/20'
                                : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                          }
                          ${hasAnswered && !isSelected && !showAsCorrect ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{answer.answer_text}</span>
                          {showAsCorrect && <CheckCircle size={16} className="text-green-500" />}
                          {showAsWrong && <XCircle size={16} className="text-red-500" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Card>

              <div className="flex justify-center gap-4">
                {playerAnswers.map((answer, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${answer.is_correct ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}