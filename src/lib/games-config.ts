import {
  Gamepad2,
  Grid3x3,
  Brain,
  Hash,
  Zap,
  Hammer,
} from "lucide-react"
import type { GameMeta, GameId } from "./game-types"

export const GAMES: GameMeta[] = [
  {
    id: "snake",
    title: "Neon Snake",
    tagline: "Eat. Grow. Don't bite yourself.",
    description:
      "The classic serpent reimagined in glowing neon. Devour orbs, grow longer, and chase a high score. Speeds up as you feast.",
    icon: Gamepad2,
    color: "#22d3ee",
    glow: "#06b6d4",
    category: "Arcade",
    difficulty: "Medium",
    howToPlay: [
      "Use Arrow keys or WASD to steer the snake.",
      "Swallow the glowing orbs to grow and score.",
      "Avoid the walls and your own tail.",
      "On mobile, swipe to change direction.",
    ],
    scoreLabel: "Score",
    higherIsBetter: true,
  },
  {
    id: "2048",
    title: "2048 Fusion",
    tagline: "Merge tiles. Reach 2048. Then keep going.",
    description:
      "Slide tiles, fuse matching numbers, and chase the legendary 2048 tile. Endless mode lets you push beyond.",
    icon: Grid3x3,
    color: "#f59e0b",
    glow: "#d97706",
    category: "Puzzle",
    difficulty: "Easy",
    howToPlay: [
      "Use Arrow keys or WASD to slide all tiles.",
      "Tiles with the same number fuse into one.",
      "On mobile, swipe across the board.",
      "Reach 2048 to win — but you can keep merging for a higher score.",
    ],
    scoreLabel: "Score",
    higherIsBetter: true,
  },
  {
    id: "memory",
    title: "Memory Matrix",
    tagline: "Find every pair before time runs out.",
    description:
      "Flip cards, memorize positions, and match every pair. Fewer moves and faster times earn bigger scores.",
    icon: Brain,
    color: "#a855f7",
    glow: "#9333ea",
    category: "Puzzle",
    difficulty: "Easy",
    howToPlay: [
      "Click a card to flip it.",
      "Flip two cards to try to find a matching pair.",
      "Matched pairs stay revealed.",
      "Clear the board as fast as you can with as few moves as possible.",
    ],
    scoreLabel: "Score",
    higherIsBetter: true,
  },
  {
    id: "tictactoe",
    title: "Tic-Tac-Toe AI",
    tagline: "Can you beat the unbeatable AI?",
    description:
      "Classic noughts and crosses against a minimax AI that never loses — or play a local 2-player match.",
    icon: Hash,
    color: "#10b981",
    glow: "#059669",
    category: "Strategy",
    difficulty: "Hard",
    howToPlay: [
      "Click any empty cell to place your mark.",
      "Get three in a row — horizontally, vertically, or diagonally — to win.",
      "Play vs an unbeatable AI, an easy bot, or a friend.",
      "Draws count as a moral victory against the hardest AI.",
    ],
    scoreLabel: "Wins",
    higherIsBetter: true,
  },
  {
    id: "reaction",
    title: "Reaction Rush",
    tagline: "How fast are your reflexes?",
    description:
      "Wait for green, then tap as fast as you can. Five rounds test your nerves and average out your reflexes.",
    icon: Zap,
    color: "#ef4444",
    glow: "#dc2626",
    category: "Reflex",
    difficulty: "Easy",
    howToPlay: [
      "Click Start to begin a round.",
      "Wait for the panel to turn green.",
      "Tap as quickly as you can — but not before green!",
      "Five rounds average your reaction time. Lower is better.",
    ],
    scoreLabel: "Best ms",
    higherIsBetter: false,
  },
  {
    id: "whack",
    title: "Whack-a-Mole",
    tagline: "Bonk every mole. Miss none.",
    description:
      "Moles pop up randomly — bonk them before they vanish. 30 seconds of frantic reflex action.",
    icon: Hammer,
    color: "#ec4899",
    glow: "#db2777",
    category: "Reflex",
    difficulty: "Medium",
    howToPlay: [
      "Click a mole the moment it pops up.",
      "Each hit scores points; misses lose a little time.",
      "You have 30 seconds — hit as many as possible.",
      "Golden moles are worth bonus points.",
    ],
    scoreLabel: "Score",
    higherIsBetter: true,
  },
]

export const GAME_MAP: Record<GameId, GameMeta> = GAMES.reduce(
  (acc, g) => ({ ...acc, [g.id]: g }),
  {} as Record<GameId, GameMeta>
)
