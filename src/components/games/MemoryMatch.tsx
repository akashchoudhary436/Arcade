"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import { Button } from "@/components/ui/button"
import { Timer, MousePointerClick, RotateCcw, Check } from "lucide-react"
import type { GameProps } from "@/lib/game-types"

const ICON_POOL = [
  "👾", "🛸", "🌈", "⚡", "🔥", "💎", "🎯", "🚀",
  "🦄", "🐉", "🎭", "🎲", "🎸", "🕹️", "🧩", "🌟",
  "🎲", "🍭", "🎮", "🃏", "💫", "🔮", "🦊", "🌙",
]

type Difficulty = "easy" | "medium" | "hard"
const CONFIG: Record<Difficulty, { cols: number; rows: number; label: string }> = {
  easy: { cols: 4, rows: 4, label: "Easy · 8 pairs" },
  medium: { cols: 6, rows: 4, label: "Medium · 12 pairs" },
  hard: { cols: 6, rows: 6, label: "Hard · 18 pairs" },
}

interface Card {
  id: number
  icon: string
  pair: number
  flipped: boolean
  matched: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(diff: Difficulty): Card[] {
  const { cols, rows } = CONFIG[diff]
  const pairs = (cols * rows) / 2
  const icons = shuffle(ICON_POOL).slice(0, pairs)
  const deck: Card[] = []
  let id = 0
  icons.forEach((icon, i) => {
    deck.push({ id: id++, icon, pair: i, flipped: false, matched: false })
    deck.push({ id: id++, icon, pair: i, flipped: false, matched: false })
  })
  return shuffle(deck)
}

export function MemoryMatch({}: GameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [deck, setDeck] = useState<Card[]>(() => buildDeck("easy"))
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [won, setWon] = useState(false)
  const lockRef = useRef(false)
  const submittedRef = useRef(false)
  const startRef = useRef<number>(0)

  const { cols, rows } = CONFIG[difficulty]
  const totalPairs = (cols * rows) / 2
  const { submitScore, unlockAchievement } = useGameStore()

  // timer
  useEffect(() => {
    if (!running || won) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 250)
    return () => clearInterval(id)
  }, [running, won])

  const score = useMemo(() => {
    if (!won) return 0
    return Math.max(0, 10000 - moves * 150 - elapsed * 20 + totalPairs * 50)
  }, [won, moves, elapsed, totalPairs])

  const reset = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff)
      setDeck(buildDeck(diff))
      setFlipped([])
      setMoves(0)
      setMatches(0)
      setElapsed(0)
      setRunning(false)
      setWon(false)
      submittedRef.current = false
      lockRef.current = false
      sound.play("start")
    },
    []
  )

  const flip = (id: number) => {
    if (lockRef.current || won) return
    const card = deck.find((c) => c.id === id)
    if (!card || card.flipped || card.matched) return
    if (!running) {
      setRunning(true)
      startRef.current = Date.now()
    }
    sound.play("flip")
    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)
    setDeck((d) => d.map((c) => (c.id === id ? { ...c, flipped: true } : c)))

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1)
      lockRef.current = true
      const [a, b] = newFlipped.map((fid) => deck.find((c) => c.id === fid)!)
      if (a.pair === b.pair) {
        setTimeout(() => {
          setDeck((d) =>
            d.map((c) =>
              c.pair === a.pair ? { ...c, matched: true } : c
            )
          )
          setMatches((m) => m + 1)
          setFlipped([])
          lockRef.current = false
          sound.play("match")
        }, 320)
      } else {
        setTimeout(() => {
          setDeck((d) =>
            d.map((c) =>
              c.id === a.id || c.id === b.id
                ? { ...c, flipped: false }
                : c
            )
          )
          setFlipped([])
          lockRef.current = false
          sound.play("nomatch")
        }, 800)
      }
    }
  }

  // win check
  useEffect(() => {
    if (matches > 0 && matches === totalPairs && !won) {
      setWon(true)
      setRunning(false)
      sound.play("win")
      const finalMoves = moves
      if (finalMoves <= 40 && difficulty === "easy")
        void unlockAchievement("memory_master")
      const s = Math.max(0, 10000 - finalMoves * 150 - elapsed * 20 + totalPairs * 50)
      if (!submittedRef.current) {
        submittedRef.current = true
        void submitScore({
          gameId: "memory",
          score: s,
          duration: elapsed * 1000,
          meta: { moves: finalMoves, difficulty },
        })
      }
    }
  }, [matches, totalPairs])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Controls */}
      <div className="flex items-center gap-2 w-full flex-wrap justify-center">
        {(Object.keys(CONFIG) as Difficulty[]).map((d) => (
          <Button
            key={d}
            size="sm"
            variant={difficulty === d ? "default" : "ghost"}
            onClick={() => reset(d)}
            className={`arcade-btn capitalize ${difficulty === d ? "bg-[var(--arcade-violet)] text-white" : ""}`}
          >
            {CONFIG[d].label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => reset(difficulty)} className="arcade-btn gap-1.5">
          <RotateCcw className="h-4 w-4" /> New
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 w-full max-w-[460px]">
        <Stat icon={Timer} label="TIME" value={`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`} accent="var(--arcade-cyan)" />
        <Stat icon={MousePointerClick} label="MOVES" value={moves} accent="var(--arcade-amber)" />
        <Stat icon={Check} label="PAIRS" value={`${matches}/${totalPairs}`} accent="var(--arcade-emerald)" />
      </div>

      {/* Board */}
      <div
        className="relative w-full max-w-[460px] rounded-2xl p-2.5"
        style={{
          background: "rgba(8,8,18,0.7)",
          border: "1px solid var(--arcade-border)",
          boxShadow: "inset 0 0 40px -10px rgba(168,85,247,0.18)",
        }}
      >
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {deck.map((card) => {
            const show = card.flipped || card.matched
            return (
              <button
                key={card.id}
                onClick={() => flip(card.id)}
                className="relative aspect-square rounded-lg group"
                style={{ perspective: "600px" }}
                aria-label={show ? card.icon : "hidden card"}
              >
                <div
                  className="absolute inset-0 transition-transform duration-300"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: show ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* back */}
                  <div
                    className="absolute inset-0 rounded-lg grid place-items-center"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      background:
                        "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(34,211,238,0.12))",
                      border: "1px solid var(--arcade-border)",
                    }}
                  >
                    <span className="text-lg sm:text-2xl opacity-30 group-hover:opacity-60 transition-opacity">
                      ❓
                    </span>
                  </div>
                  {/* front */}
                  <div
                    className="absolute inset-0 rounded-lg grid place-items-center"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: card.matched
                        ? "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(34,211,238,0.2))"
                        : "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(240,171,252,0.2))",
                      border: card.matched
                        ? "1px solid var(--arcade-emerald)"
                        : "1px solid var(--arcade-violet)",
                      boxShadow: card.matched
                        ? "0 0 16px -4px var(--arcade-emerald)"
                        : "0 0 14px -6px var(--arcade-violet)",
                    }}
                  >
                    <span className="text-xl sm:text-3xl">{card.icon}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {won && (
          <div
            className="absolute inset-0 grid place-items-center rounded-2xl z-10 animate-pop"
            style={{ background: "rgba(5,5,12,0.85)", backdropFilter: "blur(3px)" }}
          >
            <div className="text-center px-6">
              <div className="text-5xl mb-2">🎉</div>
              <div className="text-2xl font-black mb-1" style={{ color: "var(--arcade-emerald)" }}>
                Cleared!
              </div>
              <div className="text-sm text-[var(--arcade-text-dim)] mb-1">
                {moves} moves · {Math.floor(elapsed / 60)}m {elapsed % 60}s
              </div>
              <div className="text-lg font-black mb-4 neon-text" style={{ color: "var(--arcade-amber)" }}>
                Score {score}
              </div>
              <Button onClick={() => reset(difficulty)} className="gap-2 text-black" style={{ background: "var(--arcade-emerald)" }}>
                <RotateCcw className="h-4 w-4" /> Play Again
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="text-[11px] text-[var(--arcade-text-dim)]">
        Flip two cards to find matching pairs. Fewer moves & faster time = higher score.
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className="flex-1 neon-panel rounded-xl px-3 py-2 flex items-center gap-2" style={{ borderColor: `${accent}33` }}>
      <Icon className="h-4 w-4" style={{ color: accent }} />
      <div>
        <div className="text-[10px] tracking-widest text-[var(--arcade-text-dim)]">{label}</div>
        <div className="text-base font-black tabular-nums" style={{ color: accent }}>
          {value}
        </div>
      </div>
    </div>
  )
}
