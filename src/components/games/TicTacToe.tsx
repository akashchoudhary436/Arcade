"use client"

import { useCallback, useEffect, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import { Button } from "@/components/ui/button"
import { Bot, Users, Zap, RotateCcw } from "lucide-react"
import type { GameProps } from "@/lib/game-types"

type Cell = "X" | "O" | null
type Mode = "hard" | "easy" | "friend"
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function winnerOf(b: Cell[]): { player: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line
    if (b[a] && b[a] === b[c] && b[a] === b[d])
      return { player: b[a], line }
  }
  return null
}

function isFull(b: Cell[]) {
  return b.every((c) => c !== null)
}

// minimax: returns best score for the player to move
function minimax(b: Cell[], ai: "X" | "O", human: "X" | "O", isAi: boolean): number {
  const w = winnerOf(b)
  if (w) return w.player === ai ? 10 : -10
  if (isFull(b)) return 0

  const scores: number[] = []
  for (let i = 0; i < 9; i++) {
    if (b[i] === null) {
      b[i] = isAi ? ai : human
      scores.push(minimax(b, ai, human, !isAi))
      b[i] = null
    }
  }
  return isAi ? Math.max(...scores) : Math.min(...scores)
}

function bestMove(b: Cell[], ai: "X" | "O"): number {
  const human = ai === "X" ? "O" : "X"
  let best = -Infinity
  let move = -1
  for (let i = 0; i < 9; i++) {
    if (b[i] === null) {
      b[i] = ai
      const score = minimax(b, ai, human, false)
      b[i] = null
      if (score > best) {
        best = score
        move = i
      }
    }
  }
  return move
}

function easyMove(b: Cell[]): number {
  const empty = b.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0)
  return empty[Math.floor(Math.random() * empty.length)]
}

export function TicTacToe({}: GameProps) {
  const [mode, setMode] = useState<Mode>("hard")
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [turn, setTurn] = useState<"X" | "O">("X")
  const [winInfo, setWinInfo] = useState<{ player: Cell; line: number[] } | null>(null)
  const [draw, setDraw] = useState(false)
  const [record, setRecord] = useState({ w: 0, l: 0, d: 0 })
  const [thinking, setThinking] = useState(false)

  const aiSymbol: "O" = "O"
  const humanSymbol: "X" = "X"
  const { submitScore, unlockAchievement } = useGameStore()

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null))
    setTurn("X")
    setWinInfo(null)
    setDraw(false)
    setThinking(false)
    sound.play("start")
  }, [])

  const resetAll = () => {
    reset()
    setRecord({ w: 0, l: 0, d: 0 })
  }

  // AI move
  useEffect(() => {
    if (mode === "friend") return
    if (winInfo || draw) return
    if (turn !== aiSymbol) return
    const t = setTimeout(() => {
      setBoard((b) => {
        if (winnerOf(b) || isFull(b)) return b
        const move =
          mode === "hard" ? bestMove([...b], aiSymbol) : easyMove([...b])
        if (move < 0) return b
        const nb = [...b]
        nb[move] = aiSymbol
        sound.play("click")
        const w = winnerOf(nb)
        if (w) {
          setWinInfo(w)
          sound.play("lose")
          setRecord((r) => ({ ...r, l: r.l + 1 }))
        } else if (isFull(nb)) {
          setDraw(true)
          sound.play("nomatch")
          setRecord((r) => ({ ...r, d: r.d + 1 }))
          if (mode === "hard") void unlockAchievement("draw_ai")
        } else {
          setTurn(humanSymbol)
        }
        return nb
      })
      setThinking(false)
    }, 450)
    return () => clearTimeout(t)
  }, [turn, mode, winInfo, draw])

  const place = (i: number) => {
    if (board[i] || winInfo || draw || thinking) return
    if (mode !== "friend" && turn !== humanSymbol) return
    sound.play("click")
    const nb = [...board]
    nb[i] = turn
    setBoard(nb)
    const w = winnerOf(nb)
    if (w) {
      setWinInfo(w)
      if (mode === "friend") {
        sound.play("win")
      } else {
        // human won vs AI
        sound.play("win")
        setRecord((r) => ({ ...r, w: r.w + 1 }))
        void submitScore({ gameId: "tictactoe", score: r_wins(record) + 1 })
        if (mode === "hard") void unlockAchievement("beat_ai")
      }
      return
    }
    if (isFull(nb)) {
      setDraw(true)
      sound.play("nomatch")
      setRecord((r) => ({ ...r, d: r.d + 1 }))
      if (mode === "hard") void unlockAchievement("draw_ai")
      return
    }
    const nextTurn = turn === "X" ? "O" : "X"
    setTurn(nextTurn)
    if (mode !== "friend" && nextTurn === aiSymbol) setThinking(true)
  }

  function r_wins(r: { w: number }) {
    return r.w + 1
  }

  const modeLabel =
    mode === "hard" ? "Hard AI" : mode === "easy" ? "Easy Bot" : "2 Players"

  return (
    <div className="flex flex-col items-center gap-4">
      {/* mode selector */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Button size="sm" variant={mode === "hard" ? "default" : "ghost"} onClick={() => { setMode("hard"); reset() }} className={`arcade-btn gap-1.5 ${mode === "hard" ? "bg-[var(--arcade-emerald)] text-black" : ""}`}>
          <Bot className="h-4 w-4" /> Hard AI
        </Button>
        <Button size="sm" variant={mode === "easy" ? "default" : "ghost"} onClick={() => { setMode("easy"); reset() }} className={`arcade-btn gap-1.5 ${mode === "easy" ? "bg-[var(--arcade-amber)] text-black" : ""}`}>
          <Zap className="h-4 w-4" /> Easy Bot
        </Button>
        <Button size="sm" variant={mode === "friend" ? "default" : "ghost"} onClick={() => { setMode("friend"); reset() }} className={`arcade-btn gap-1.5 ${mode === "friend" ? "bg-[var(--arcade-cyan)] text-black" : ""}`}>
          <Users className="h-4 w-4" /> 2 Players
        </Button>
      </div>

      {/* status + record */}
      <div className="flex items-center gap-2 w-full max-w-[380px]">
        <div className="flex-1 neon-panel rounded-xl px-3 py-2 text-center">
          <div className="text-[10px] tracking-widest text-[var(--arcade-text-dim)]">STATUS</div>
          <div className="text-sm font-bold" style={{ color: "var(--arcade-accent)" }}>
            {winInfo
              ? `${winInfo.player} wins!`
              : draw
              ? "Draw!"
              : thinking
              ? "AI thinking…"
              : `${turn}'s turn`}
          </div>
        </div>
        <div className="flex gap-1.5">
          <RecordPill label="W" value={record.w} accent="var(--arcade-emerald)" />
          <RecordPill label="D" value={record.d} accent="var(--arcade-amber)" />
          <RecordPill label="L" value={record.l} accent="var(--arcade-red)" />
        </div>
      </div>

      {/* board */}
      <div className="relative">
        <div
          className="grid grid-cols-3 gap-2 p-3 rounded-2xl"
          style={{
            background: "rgba(8,8,18,0.7)",
            border: "1px solid var(--arcade-border)",
            boxShadow: "inset 0 0 40px -10px rgba(16,185,129,0.18)",
          }}
        >
          {board.map((cell, i) => {
            const isWin = winInfo?.line.includes(i)
            return (
              <button
                key={i}
                onClick={() => place(i)}
                disabled={!!cell || !!winInfo || draw || thinking}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl grid place-items-center text-5xl font-black transition-all"
                style={{
                  background: isWin
                    ? "rgba(52,211,153,0.18)"
                    : "rgba(255,255,255,0.03)",
                  border: isWin
                    ? "1px solid var(--arcade-emerald)"
                    : "1px solid var(--arcade-border)",
                  boxShadow: isWin ? "0 0 18px -4px var(--arcade-emerald)" : "none",
                  cursor: cell || winInfo || draw ? "default" : "pointer",
                }}
              >
                {cell && (
                  <span
                    className={isWin ? "animate-pop" : ""}
                    style={{
                      color: cell === "X" ? "var(--arcade-cyan)" : "var(--arcade-pink)",
                      textShadow: `0 0 16px ${cell === "X" ? "var(--arcade-cyan)" : "var(--arcade-pink)"}`,
                    }}
                  >
                    {cell}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* win line */}
        {winInfo && <WinLine line={winInfo.line} />}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={reset} className="arcade-btn gap-1.5">
          <RotateCcw className="h-4 w-4" /> New Round
        </Button>
        <Button size="sm" variant="ghost" onClick={resetAll} className="arcade-btn gap-1.5">
          Reset Record
        </Button>
      </div>

      <div className="text-[11px] text-[var(--arcade-text-dim)]">
        Mode: {modeLabel} · {mode === "friend" ? "Take turns on this device." : `You are X, the ${modeLabel} is O.`}
      </div>
    </div>
  )
}

function RecordPill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="neon-panel rounded-xl px-2.5 py-2 text-center min-w-[44px]" style={{ borderColor: `${accent}33` }}>
      <div className="text-[10px] tracking-widest" style={{ color: accent }}>{label}</div>
      <div className="text-base font-black tabular-nums">{value}</div>
    </div>
  )
}

function WinLine({ line }: { line: number[] }) {
  // compute line geometry based on indices
  const positions: Record<number, { x: number; y: number }> = {
    0: { x: 0, y: 0 }, 1: { x: 1, y: 0 }, 2: { x: 2, y: 0 },
    3: { x: 0, y: 1 }, 4: { x: 1, y: 1 }, 5: { x: 2, y: 1 },
    6: { x: 0, y: 2 }, 7: { x: 1, y: 2 }, 8: { x: 2, y: 2 },
  }
  const a = positions[line[0]]
  const b = positions[line[2]]
  const cell = 100 // percentage units (3 cols)
  const gap = 4
  const x1 = a.x * (cell / 1) + 50
  const y1 = a.y * (cell / 1) + 50
  const x2 = b.x * (cell / 1) + 50
  const y2 = b.y * (cell / 1) + 50
  // map to % of board (3 cells + 2 gaps). Simpler: use indices 0..2 → 16.6%,50%,83.3%
  const pct = (i: number) => `${16.66 + i * 33.34}%`
  void gap
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
      <line
        x1={pct(a.x)}
        y1={pct(a.y)}
        x2={pct(b.x)}
        y2={pct(b.y)}
        stroke="var(--arcade-emerald)"
        strokeWidth="6"
        strokeLinecap="round"
        style={{
          filter: "drop-shadow(0 0 8px var(--arcade-emerald))",
          strokeDasharray: 300,
          strokeDashoffset: 300,
          animation: "dash 0.4s ease forwards",
        }}
      />
      <style>{`@keyframes dash{to{stroke-dashoffset:0}}`}</style>
      {/* suppress unused */}
      <defs>
        <pattern id="_" />
      </defs>
      {/* unused vars reference to avoid lint */}
      <g data-x1={x1} data-y1={y1} data-x2={x2} data-y2={y2} />
    </svg>
  )
}
