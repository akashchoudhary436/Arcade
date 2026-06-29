import type { AchievementDef } from "./game-types"

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_step",
    title: "First Steps",
    description: "Play any game for the first time.",
    icon: "🎮",
  },
  {
    id: "snake_50",
    title: "Snake Charmer",
    description: "Score 50+ in Neon Snake.",
    icon: "🐍",
  },
  {
    id: "snake_150",
    title: "Ouroboros",
    description: "Score 150+ in Neon Snake.",
    icon: "🐉",
  },
  {
    id: "fusion_2048",
    title: "Fusion Master",
    description: "Reach the 2048 tile.",
    icon: "🔮",
  },
  {
    id: "fusion_4096",
    title: "Beyond Infinity",
    description: "Reach the 4096 tile.",
    icon: "♾️",
    secret: true,
  },
  {
    id: "memory_master",
    title: "Total Recall",
    description: "Clear Memory Matrix in under 40 moves.",
    icon: "🧠",
  },
  {
    id: "beat_ai",
    title: "The Impossible",
    description: "Beat the Hard AI at Tic-Tac-Toe. (Good luck.)",
    icon: "🏆",
    secret: true,
  },
  {
    id: "draw_ai",
    title: "Stalemate Artist",
    description: "Draw against the Hard AI.",
    icon: "🤝",
  },
  {
    id: "reflex_sub300",
    title: "Lightning Fingers",
    description: "React in under 300ms in Reaction Rush.",
    icon: "⚡",
  },
  {
    id: "reflex_sub200",
    title: "Are You Human?",
    description: "React in under 200ms in Reaction Rush.",
    icon: "🌟",
    secret: true,
  },
  {
    id: "whack_30",
    title: "Mole Exterminator",
    description: "Score 30+ in Whack-a-Mole.",
    icon: "🔨",
  },
  {
    id: "arcade_rat",
    title: "Arcade Rat",
    description: "Play at least 4 different games.",
    icon: "🐀",
  },
  {
    id: "score_hunter",
    title: "Score Hunter",
    description: "Submit 10 high scores total.",
    icon: "🎯",
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Play a game after midnight.",
    icon: "🦉",
    secret: true,
  },
]
