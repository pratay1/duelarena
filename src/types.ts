export type MatchStatus = 'waiting' | 'active' | 'completed' | 'cancelled'
export type RoundStatus = 'pending' | 'active' | 'completed'
export type GameStatus = 'idle' | 'category_selection' | 'wagering' | 'loading' | 'playing' | 'round_complete' | 'failed' | 'finished'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Theme = 'amber' | 'cyan' | 'green' | 'red'

export interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface Profile {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  points: number
  tokens: number
  games_played: number
  current_streak: number
  best_streak: number
  level: number
  lifetime_points: number
  last_active: string | null
  created_at: string
}

export interface Settings {
  scanlines: boolean
  glitch: boolean
  animations: 'minimal' | 'normal' | 'max'
  difficulty: Difficulty | 'all'
  theme: Theme
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface TriviaQuestion {
  id: string
  category_id: string
  question_text: string
  correct_answer_id: string
  difficulty: Difficulty
  created_at: string
}

export interface Answer {
  id: string
  question_id: string
  answer_text: string
  is_correct: boolean
}

export interface Match {
  id: string
  player1_id: string
  player2_id: string | null
  category_id: string
  status: MatchStatus
  wager: number
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
  points_earned: number
  created_at: string
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
  points: number
  created_at: string
}

export interface GameHistory {
  id: string
  user_id: string
  category: string | null
  score: number
  tokens_earned: number
  tokens_wagered: number
  correct_answers: number
  total_questions: number
  duration_seconds: number
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

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

export interface GameState {
  questions: TriviaQuestion[]
  currentQuestionIndex: number
  sessionScore: number
  status: GameStatus
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

export interface DatabaseErrorInfo {
  code: string
  message: string
  hint?: string
  details?: string
}