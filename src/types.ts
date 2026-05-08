export type UserRole = 'owner' | 'participant' | 'spectator' | 'admin' | 'service_role'
export type MatchStatus = 'waiting' | 'active' | 'completed' | 'cancelled'
export type RoundStatus = 'pending' | 'active' | 'completed'
export type AnswerStatus = 'pending' | 'correct' | 'incorrect'

export interface Profile {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  elo: number
  wins: number
  losses: number
  created_at: string
}

export interface Match {
  id: string
  player1_id: string
  player2_id: string | null
  category_id: string
  status: MatchStatus
  winner_id: string | null
  player1_score: number
  player2_score: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface MatchRound {
  id: string
  match_id: string
  round_number: number
  question_id: string
  status: RoundStatus
  created_at: string
}

export interface PlayerAnswer {
  id: string
  round_id: string
  player_id: string
  answer_id: string
  is_correct: boolean
  response_time_ms: number
  created_at: string
}

export interface TriviaQuestion {
  id: string
  category_id: string
  question_text: string
  correct_answer_id: string
  created_at: string
}

export interface Answer {
  id: string
  question_id: string
  answer_text: string
  is_correct: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface RankedSeason {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export interface LeaderboardSnapshot {
  id: string
  season_id: string
  user_id: string
  rank: number
  elo: number
  created_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface DatabaseErrorInfo {
  code: string
  message: string
  hint?: string
  details?: string
}

export interface GameState {
  match: Match | null
  rounds: MatchRound[]
  currentRound: MatchRound | null
  questions: TriviaQuestion[]
  answers: Record<string, Answer[]>
  playerAnswers: PlayerAnswer[]
  timeRemaining: number
  isPlayerTurn: boolean
}

export interface GameStore {
  gameState: GameState
  setMatch: (match: Match) => void
  setRounds: (rounds: MatchRound[]) => void
  setCurrentRound: (round: MatchRound | null) => void
  addPlayerAnswer: (answer: PlayerAnswer) => void
  setTimeRemaining: (time: number) => void
  resetGame: () => void
}