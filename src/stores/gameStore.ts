import { create } from 'zustand'
import type { Match, MatchRound, PlayerAnswer, TriviaQuestion, Answer } from '../types'

interface GameState {
  match: Match | null
  rounds: MatchRound[]
  currentRound: MatchRound | null
  questions: TriviaQuestion[]
  answers: Record<string, Answer[]>
  playerAnswers: PlayerAnswer[]
  timeRemaining: number
  isPlayerTurn: boolean
}

interface GameStore extends GameState {
  setMatch: (match: Match | null) => void
  setRounds: (rounds: MatchRound[]) => void
  setCurrentRound: (round: MatchRound | null) => void
  setQuestions: (questions: TriviaQuestion[]) => void
  setAnswersForQuestion: (questionId: string, answers: Answer[]) => void
  addPlayerAnswer: (answer: PlayerAnswer) => void
  setTimeRemaining: (time: number) => void
  setIsPlayerTurn: (isTurn: boolean) => void
  resetGame: () => void
}

const initialState: GameState = {
  match: null,
  rounds: [],
  currentRound: null,
  questions: [],
  answers: {},
  playerAnswers: [],
  timeRemaining: 0,
  isPlayerTurn: false,
}

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setMatch: (match) => set({ match }),
  setRounds: (rounds) => set({ rounds }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setQuestions: (questions) => set({ questions }),
  setAnswersForQuestion: (questionId, answers) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answers },
    })),
  addPlayerAnswer: (answer) =>
    set((state) => ({
      playerAnswers: [...state.playerAnswers, answer],
    })),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setIsPlayerTurn: (isTurn) => set({ isPlayerTurn: isTurn }),
  resetGame: () => set(initialState),
}))