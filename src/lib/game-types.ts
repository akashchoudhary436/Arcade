import type { LucideIcon } from "lucide-react"

export type GameId =
  | "snake"
  | "2048"
  | "memory"
  | "tictactoe"
  | "reaction"
  | "whack"

export interface GameProps {
  onExit: () => void
}

export interface GameMeta {
  id: GameId
  title: string
  tagline: string
  description: string
  icon: LucideIcon
  color: string // primary accent (hex)
  glow: string // glow color
  category: "Arcade" | "Puzzle" | "Reflex" | "Strategy"
  difficulty: "Easy" | "Medium" | "Hard"
  howToPlay: string[]
  scoreLabel: string
  higherIsBetter: boolean
}

export interface ScoreEntry {
  id: string
  gameId: GameId
  playerName: string
  score: number
  duration: number | null
  meta: string | null
  createdAt: string
}

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string
  secret?: boolean
}
