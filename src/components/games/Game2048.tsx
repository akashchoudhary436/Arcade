"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import { Button } from "@/components/ui/button"
import { RotateCcw, Undo2, Trophy } from "lucide-react"
import type { GameProps } from "@/lib/game-types"

type Dir = "up" | "down" | "left" | "right"

interface Tile {
  id: number
  value: number
  r: number
  c: number
  isNew?: boolean
  merged?: boolean
}

const SIZE = 4
let tileId = 1

const TILE_COLORS: Record<number, { bg: string; fg: string; glow?: string }> = {
  2: { bg: "linear-gradient(135deg,#1e2a44,#243454)", fg: "#cbd5e1" },
  4: { bg: "linear-gradient(135deg,#0e3b43,#125e6a)", fg: "#67e8f9" },
  8: { bg: "linear-gradient(135deg,#0c4a6e,#075985)", fg: "#7dd3fc" },
  16: { bg: "linear-gradient(135deg,#065f46,#047857)", fg: "#6ee7b7" },
  32: { bg: "linear-gradient(135deg,#92400e,#b45309)", fg: "#fcd34d" },
  64: { bg: "linear-gradient(135deg,#9a3412,#c2410c)", fg: "#fdba74" },
  128: { bg: "linear-gradient(135deg,#9d174d,#be185d)", fg: "#f9a8d4", glow: "#ec4899" },
  256: { bg: "linear-gradient(135deg,#6b21a8,#7e22ce)", fg: "#d8b4fe", glow: "#a855f7" },
  512: { bg: "linear-gradient(135deg,#155e75,#0891b2)", fg: "#a5f3fc", glow: "#06b6d4" },
  1024: { bg: "linear-gradient(135deg,#9f1239,#e11d48)", fg: "#fecdd3", glow: "#f43f5e" },
  2048: { bg: "linear-gradient(135deg,#b45309,#f59e0b)", fg: "#fffbeb", glow: "#fbbf24" },
  4096: { bg: "linear-gradient(135deg,#7c2d12,#dc2626,#f59e0b)", fg: "#fff", glow: "#f97316" },
}

function colorFor(v: number) {
  return TILE_COLORS[v] ?? TILE_COLORS[4096]
}

function emptyBoard(): (Tile | null)[][] {
  return Array.from({ length: SIZE }, () => Array<Tile | null>(SIZE).fill(null))
}

function tilesToBoard(tiles: Tile[]): (Tile | null)[][] {
  const b = emptyBoard()
  for (const t of tiles) b[t.r][t.c] = t
  return b
}

function spawnTile(tiles: Tile[]): Tile | null {
  const occupied = new Set(tiles.map((t) => `${t.r},${t.c}`))
  const empty: [number, number][] = []
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!occupied.has(`${r},${c}`)) empty.push([r, c])
  if (empty.length === 0) return null
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  return {
    id: tileId++,
    value: Math.random() < 0.9 ? 2 : 4,
    r,
    c,
    isNew: true,
  }
}

function getLine(board: (Tile | null)[][], idx: number, dir: Dir): (Tile | null)[] {
  const line: (Tile | null)[] = []
  for (let i = 0; i < SIZE; i++) {
    if (dir === "left") line.push(board[idx][i])
    else if (dir === "right") line.push(board[idx][SIZE - 1 - i])
    else if (dir === "up") line.push(board[i][idx])
    else line.push(board[SIZE - 1 - i][idx])
  }
  return line
}

function setLine(
  board: (Tile | null)[][],
  idx: number,
  dir: Dir,
  line: (Tile | null)[]
) {
  for (let i = 0; i < SIZE; i++) {
    const t = line[i]
    if (dir === "left") board[idx][i] = t
    else if (dir === "right") board[idx][SIZE - 1 - i] = t
    else if (dir === "up") board[i][idx] = t
    else board[SIZE - 1 - i][idx] = t
    if (t) {
      if (dir === "left" || dir === "right") t.r = idx
      else t.c = idx
      // position index
      if (dir === "left") t.c = i
      else if (dir === "right") t.c = SIZE - 1 - i
      else if (dir === "up") t.r = i
      else t.r = SIZE - 1 - i
    }
  }
}

function moveLine(line: (Tile | null)[]): {
  line: (Tile | null)[]
  gained: number
  mergedCount: number
} {
  const tiles = line.filter((t): t is Tile => !!t)
  const result: (Tile | null)[] = []
  let gained = 0
  let mergedCount = 0
  let i = 0
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
      const merged: Tile = {
        ...tiles[i],
        id: tileId++,
        value: tiles[i].value * 2,
        merged: true,
      }
      result.push(merged)
      gained += merged.value
      mergedCount++
      i += 2
    } else {
      result.push(tiles[i])
      i++
    }
  }
  while (result.length < SIZE) result.push(null)
  return { line: result, gained, mergedCount }
}

function boardsEqual(a: Tile[], b: Tile[]): boolean {
  if (a.length !== b.length) return false
  const map = new Map(a.map((t) => [t.id, t]))
  for (const t of b) {
    const o = map.get(t.id)
    if (!o || o.r !== t.r || o.c !== t.c || o.value !== t.value) return false
  }
  return true
}

export function Game2048({}: GameProps) {
  const [tiles, setTiles] = useState<Tile[]>(() => {
    const t1 = spawnTile([])
    const t2 = spawnTile(t1 ? [t1] : [])
    return [t1, t2].filter(Boolean) as Tile[]
  })
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => {
    if (typeof window === "undefined") return 0
    return Number(localStorage.getItem("arcade-2048-best") || "0")
  })
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const [keepGoing, setKeepGoing] = useState(false)
  const [history, setHistory] = useState<{ tiles: Tile[]; score: number }[]>([])
  const inputLock = useRef(false)
  const submitted = useRef(false)

  const { submitScore, unlockAchievement } = useGameStore()

  const persistBest = useCallback(
    (s: number) => {
      setBest((prev) => {
        const nb = Math.max(prev, s)
        localStorage.setItem("arcade-2048-best", String(nb))
        return nb
      })
    },
    []
  )

  const checkEnd = useCallback(
    (current: Tile[]) => {
      const board = tilesToBoard(current)
      // any empty?
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
          if (!board[r][c]) return false
      // any merges available?
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
          const v = board[r][c]?.value
          if (c + 1 < SIZE && board[r][c + 1]?.value === v) return false
          if (r + 1 < SIZE && board[r + 1][c]?.value === v) return false
        }
      return true
    },
    []
  )

  const doMove = useCallback(
    (dir: Dir) => {
      if (inputLock.current || over) return
      setTiles((prev) => {
        const board = tilesToBoard(prev)
        // clear flags
        for (const t of prev) {
          t.isNew = false
          t.merged = false
        }
        let totalGained = 0
        let totalMerged = 0
        const snapshot = prev.map((t) => ({ ...t }))
        for (let idx = 0; idx < SIZE; idx++) {
          const line = getLine(board, idx, dir)
          const { line: newLine, gained, mergedCount } = moveLine(line)
          setLine(board, idx, dir, newLine)
          totalGained += gained
          totalMerged += mergedCount
        }
        const flat: Tile[] = []
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++)
            if (board[r][c]) flat.push(board[r][c] as Tile)

        if (boardsEqual(flat, prev)) return prev // no change

        // push history
        setHistory((h) => [...h.slice(-9), { tiles: snapshot, score }])

        const withNew = [...flat, spawnTile(flat)].filter(Boolean) as Tile[]
        const newScore = score + totalGained
        setScore(newScore)
        persistBest(newScore)

        if (totalMerged > 0) sound.play("merge")
        else sound.play("move")

        // achievements / win
        const maxVal = Math.max(...withNew.map((t) => t.value))
        if (maxVal >= 2048 && !won) {
          setWon(true)
          sound.play("win")
          void unlockAchievement("fusion_2048")
        }
        if (maxVal >= 4096) void unlockAchievement("fusion_4096")

        if (checkEnd(withNew)) {
          setOver(true)
          sound.play("lose")
          if (!submitted.current) {
            submitted.current = true
            void submitScore({ gameId: "2048", score: newScore, meta: { best: maxVal } })
          }
        }
        return withNew
      })
    },
    [score, over, won, persistBest, checkEnd, submitScore, unlockAchievement]
  )

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const map: Record<string, Dir> = {
        arrowup: "up",
        arrowdown: "down",
        arrowleft: "left",
        arrowright: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      }
      if (map[k]) {
        e.preventDefault()
        doMove(map[k])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [doMove])

  // touch / swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const ax = Math.abs(dx)
    const ay = Math.abs(dy)
    if (Math.max(ax, ay) < 24) return
    if (ax > ay) doMove(dx > 0 ? "right" : "left")
    else doMove(dy > 0 ? "down" : "up")
    touchStart.current = null
  }

  const newGame = () => {
    sound.play("start")
    submitted.current = false
    setHistory([])
    setOver(false)
    setWon(false)
    setKeepGoing(false)
    setScore(0)
    const t1 = spawnTile([])
    const t2 = spawnTile(t1 ? [t1] : [])
    setTiles([t1, t2].filter(Boolean) as Tile[])
  }

  const undo = () => {
    if (history.length === 0) return
    sound.play("click")
    const last = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setTiles(last.tiles.map((t) => ({ ...t, isNew: false, merged: false })))
    setScore(last.score)
    setOver(false)
    submitted.current = false
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Score row */}
      <div className="flex items-center gap-2 w-full max-w-[460px]">
        <ScorePill label="SCORE" value={score} accent="var(--arcade-cyan)" />
        <ScorePill label="BEST" value={best} accent="var(--arcade-amber)" />
        <div className="ml-auto flex gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={undo}
            disabled={history.length === 0}
            className="arcade-btn gap-1.5"
          >
            <Undo2 className="h-4 w-4" /> <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button size="sm" onClick={newGame} className="arcade-btn gap-1.5">
            <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </div>

      {/* Board */}
      <div
        className="relative w-full max-w-[460px] aspect-square rounded-2xl p-2.5 select-none"
        style={{
          background: "rgba(8,8,18,0.7)",
          border: "1px solid var(--arcade-border)",
          boxShadow: "inset 0 0 40px -10px rgba(34,211,238,0.18)",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* background cells */}
        <div className="absolute inset-2.5 grid grid-cols-4 grid-rows-4 gap-2.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--arcade-border)" }}
            />
          ))}
        </div>

        {/* tiles */}
        <div className="absolute inset-2.5">
          {tiles.map((t) => {
            const col = colorFor(t.value)
            return (
              <div
                key={t.id}
                className={`absolute ${t.isNew ? "animate-pop" : ""} ${t.merged ? "animate-pop" : ""}`}
                style={{
                  width: "25%",
                  height: "25%",
                  left: `${t.c * 25}%`,
                  top: `${t.r * 25}%`,
                  transition: "left 0.12s ease, top 0.12s ease",
                  padding: 5,
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="w-full h-full rounded-lg grid place-items-center font-black tabular-nums"
                  style={{
                    background: col.bg,
                    color: col.fg,
                    fontSize: t.value >= 1024 ? "1.4rem" : t.value >= 128 ? "1.7rem" : "2rem",
                    boxShadow: col.glow
                      ? `0 0 18px -2px ${col.glow}, inset 0 0 16px -6px ${col.glow}`
                      : "inset 0 0 14px -8px rgba(255,255,255,0.4)",
                    border: col.glow ? `1px solid ${col.glow}55` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {t.value}
                </div>
              </div>
            )
          })}
        </div>

        {/* overlays */}
        {over && (
          <Overlay
            title="Game Over"
            subtitle={`You scored ${score}`}
            accent="var(--arcade-red)"
            icon="💀"
            onAction={newGame}
            actionLabel="Play Again"
          />
        )}
        {won && !keepGoing && !over && (
          <Overlay
            title="You hit 2048!"
            subtitle="Keep merging for an even higher score?"
            accent="var(--arcade-amber)"
            icon="🏆"
            onAction={() => {
              setKeepGoing(true)
              sound.play("click")
            }}
            actionLabel="Keep Going"
          />
        )}
      </div>

      <div className="text-[11px] text-[var(--arcade-text-dim)] flex items-center gap-1.5">
        <Trophy className="h-3 w-3" /> Arrow keys / WASD / swipe to move · merge matching tiles
      </div>
    </div>
  )
}

function ScorePill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="flex-1 neon-panel rounded-xl px-3 py-2 text-center"
      style={{ borderColor: `${accent}33` }}
    >
      <div className="text-[10px] tracking-widest text-[var(--arcade-text-dim)]">{label}</div>
      <div className="text-xl font-black tabular-nums" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}

function Overlay({
  title,
  subtitle,
  accent,
  icon,
  onAction,
  actionLabel,
}: {
  title: string
  subtitle: string
  accent: string
  icon: string
  onAction: () => void
  actionLabel: string
}) {
  return (
    <div
      className="absolute inset-0 grid place-items-center rounded-2xl z-10 animate-pop"
      style={{ background: "rgba(5,5,12,0.82)", backdropFilter: "blur(3px)" }}
    >
      <div className="text-center px-6">
        <div className="text-5xl mb-2">{icon}</div>
        <div className="text-2xl font-black mb-1" style={{ color: accent }}>
          {title}
        </div>
        <div className="text-sm text-[var(--arcade-text-dim)] mb-5">{subtitle}</div>
        <Button onClick={onAction} className="gap-2 text-black" style={{ background: accent }}>
          <RotateCcw className="h-4 w-4" /> {actionLabel}
        </Button>
      </div>
    </div>
  )
}
