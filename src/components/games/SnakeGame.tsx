"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import { Button } from "@/components/ui/button"
import { Pause, Play, RotateCcw, Trophy } from "lucide-react"
import type { GameProps } from "@/lib/game-types"

const GRID = 20
const CELL = 20
const SIZE = GRID * CELL // 400 logical px
const BASE_SPEED = 140 // ms per step
const MIN_SPEED = 60

type Pt = { x: number; y: number }
type Dir = "up" | "down" | "left" | "right"

const DIRS: Record<Dir, Pt> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

function randFood(snake: Pt[]): Pt {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`))
  const free: Pt[] = []
  for (let x = 0; x < GRID; x++)
    for (let y = 0; y < GRID; y++)
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

export function SnakeGame({}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Pt[]>([{ x: 10, y: 10 }])
  const dirRef = useRef<Dir>("right")
  const nextDirRef = useRef<Dir>("right")
  const foodRef = useRef<Pt>({ x: 5, y: 10 })
  const lastStepRef = useRef(0)
  const speedRef = useRef(BASE_SPEED)
  const runningRef = useRef(false)
  const rafRef = useRef<number>(0)
  const submittedRef = useRef(false)
  const scoreRef = useRef(0)

  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => {
    if (typeof window === "undefined") return 0
    return Number(localStorage.getItem("arcade-snake-best") || "0")
  })
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "over">("idle")
  const [length, setLength] = useState(3)

  const { submitScore, unlockAchievement } = useGameStore()

  useEffect(() => {
    // init snake
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]
    foodRef.current = randFood(snakeRef.current)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== SIZE * dpr) {
      canvas.width = SIZE * dpr
      canvas.height = SIZE * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // bg
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.fillStyle = "rgba(5,6,14,0.85)"
    ctx.fillRect(0, 0, SIZE, SIZE)

    // grid
    ctx.strokeStyle = "rgba(120,110,220,0.07)"
    ctx.lineWidth = 1
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL, 0)
      ctx.lineTo(i * CELL, SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL)
      ctx.lineTo(SIZE, i * CELL)
      ctx.stroke()
    }

    // food (pulsing orb)
    const f = foodRef.current
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200)
    ctx.save()
    ctx.shadowBlur = 18 + pulse * 10
    ctx.shadowColor = "#f472b6"
    ctx.fillStyle = "#f472b6"
    ctx.beginPath()
    ctx.arc(
      f.x * CELL + CELL / 2,
      f.y * CELL + CELL / 2,
      CELL / 2 - 3 + pulse * 1.5,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.fillStyle = "#fbcfe8"
    ctx.beginPath()
    ctx.arc(
      f.x * CELL + CELL / 2 - 2,
      f.y * CELL + CELL / 2 - 2,
      2,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.restore()

    // snake
    const snake = snakeRef.current
    for (let i = snake.length - 1; i >= 0; i--) {
      const s = snake[i]
      const t = i / Math.max(1, snake.length - 1)
      const isHead = i === 0
      ctx.save()
      ctx.shadowBlur = isHead ? 20 : 10
      ctx.shadowColor = "#22d3ee"
      const hue = 188 - t * 30
      ctx.fillStyle = isHead ? "#67e8f9" : `hsl(${hue}, 85%, ${65 - t * 25}%)`
      const pad = isHead ? 1 : 2
      roundRect(
        ctx,
        s.x * CELL + pad,
        s.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        5
      )
      ctx.fill()
      ctx.restore()

      if (isHead) {
        // eyes
        ctx.fillStyle = "#0a0a18"
        const d = dirRef.current
        const cx = s.x * CELL + CELL / 2
        const cy = s.y * CELL + CELL / 2
        const off = 4
        const eyeOff =
          d === "up" || d === "down"
            ? [
                { x: -off, y: d === "up" ? -3 : 3 },
                { x: off, y: d === "up" ? -3 : 3 },
              ]
            : [
                { x: d === "left" ? -3 : 3, y: -off },
                { x: d === "left" ? -3 : 3, y: off },
              ]
        for (const e of eyeOff) {
          ctx.beginPath()
          ctx.arc(cx + e.x, cy + e.y, 1.8, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }, [])

  const step = useCallback(() => {
    const die = () => {
      runningRef.current = false
      setStatus("over")
      sound.play("crash")
      if (!submittedRef.current) {
        submittedRef.current = true
        void submitScore({
          gameId: "snake",
          score: scoreRef.current,
          meta: { length: snakeRef.current.length },
        })
      }
    }

    const dir = dirRef.current
    // commit next dir (prevent 180 reversal)
    const nd = nextDirRef.current
    const opp: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" }
    if (nd !== opp[dir]) dirRef.current = nd

    const snake = snakeRef.current
    const head = snake[0]
    const d = DIRS[dirRef.current]
    const nx = head.x + d.x
    const ny = head.y + d.y

    // wall collision
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) {
      die()
      return
    }
    // self collision (ignore tail tip which will move)
    const willGrow = nx === foodRef.current.x && ny === foodRef.current.y
    const body = willGrow ? snake : snake.slice(0, -1)
    if (body.some((s) => s.x === nx && s.y === ny)) {
      die()
      return
    }

    const newHead = { x: nx, y: ny }
    const newSnake = [newHead, ...body]
    snakeRef.current = newSnake

    if (willGrow) {
      const food = randFood(newSnake)
      foodRef.current = food
      const newScore = scoreRef.current + 1
      scoreRef.current = newScore
      setScore(newScore)
      setLength(newSnake.length)
      sound.play("eat")
      speedRef.current = Math.max(MIN_SPEED, BASE_SPEED - newScore * 3)
      if (newScore >= 50) void unlockAchievement("snake_50")
      if (newScore >= 150) void unlockAchievement("snake_150")
      // best
      setBest((prev) => {
        const nb = Math.max(prev, newScore)
        localStorage.setItem("arcade-snake-best", String(nb))
        return nb
      })
    }
  }, [submitScore, unlockAchievement])

  // main loop
  useEffect(() => {
    let mounted = true
    const loop = (t: number) => {
      if (!mounted) return
      if (runningRef.current) {
        if (!lastStepRef.current) lastStepRef.current = t
        if (t - lastStepRef.current >= speedRef.current) {
          lastStepRef.current = t
          step()
        }
      }
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [step, draw])

  const start = useCallback(() => {
    if (status === "over" || status === "idle") {
      // reset
      snakeRef.current = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ]
      dirRef.current = "right"
      nextDirRef.current = "right"
      foodRef.current = randFood(snakeRef.current)
      scoreRef.current = 0
      speedRef.current = BASE_SPEED
      submittedRef.current = false
      setScore(0)
      setLength(3)
      lastStepRef.current = 0
    }
    runningRef.current = true
    setStatus("running")
    sound.play("start")
  }, [status])

  const pause = () => {
    runningRef.current = false
    setStatus("paused")
    sound.play("click")
  }

  const setDir = (d: Dir) => {
    const opp: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" }
    if (d !== opp[dirRef.current]) {
      nextDirRef.current = d
    }
  }

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const map: Record<string, Dir> = {
        arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right",
        w: "up", s: "down", a: "left", d: "right",
      }
      if (map[k]) {
        e.preventDefault()
        if (status === "idle" || status === "over") start()
        setDir(map[k])
      } else if (k === " " || k === "p") {
        e.preventDefault()
        if (status === "running") pause()
        else if (status === "paused" || status === "idle" || status === "over") start()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [status, start])

  // swipe
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
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
    if (status === "idle" || status === "over") start()
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? "right" : "left")
    else setDir(dy > 0 ? "down" : "up")
    touchStart.current = null
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 w-full max-w-[440px] flex-wrap justify-center">
        <ScorePill label="SCORE" value={score} accent="var(--arcade-cyan)" />
        <ScorePill label="BEST" value={best} accent="var(--arcade-amber)" />
        <ScorePill label="LENGTH" value={length} accent="var(--arcade-emerald)" />
        <div className="ml-auto flex gap-1.5">
          {status === "running" ? (
            <Button size="sm" onClick={pause} className="arcade-btn gap-1.5">
              <Pause className="h-4 w-4" /> <span className="hidden sm:inline">Pause</span>
            </Button>
          ) : (
            <Button size="sm" onClick={start} className="arcade-btn gap-1.5">
              <Play className="h-4 w-4" /> <span className="hidden sm:inline">{status === "over" ? "Retry" : status === "paused" ? "Resume" : "Start"}</span>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={start} className="arcade-btn gap-1.5">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: "1px solid var(--arcade-border)",
          boxShadow: "0 0 40px -12px var(--arcade-cyan), inset 0 0 40px -16px var(--arcade-cyan)",
          width: "100%",
          maxWidth: SIZE,
          aspectRatio: "1 / 1",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        <AnimatePresence>
          {(status === "idle" || status === "paused" || status === "over") && (
            <motion.div
              key={status}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 grid place-items-center z-10"
              style={{ background: "rgba(5,6,14,0.78)", backdropFilter: "blur(2px)" }}
            >
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="text-center px-6"
              >
                {status === "over" ? (
                  <>
                    <div className="text-5xl mb-2">💀</div>
                    <div className="text-2xl font-black mb-1" style={{ color: "var(--arcade-red)" }}>
                      Game Over
                    </div>
                    <div className="text-sm text-[var(--arcade-text-dim)] mb-5">
                      You scored {score} · length {length}
                    </div>
                  </>
                ) : status === "paused" ? (
                  <>
                    <div className="text-5xl mb-2">⏸️</div>
                    <div className="text-2xl font-black mb-4" style={{ color: "var(--arcade-cyan)" }}>
                      Paused
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-2 animate-float">🐍</div>
                    <div className="text-2xl font-black mb-1 arcade-title">Neon Snake</div>
                    <div className="text-sm text-[var(--arcade-text-dim)] mb-5">
                      Eat the pink orbs. Don't bite your tail.
                    </div>
                  </>
                )}
                <Button onClick={start} className="gap-2 text-black" style={{ background: "var(--arcade-cyan)" }}>
                  <Play className="h-4 w-4 fill-current" />
                  {status === "over" ? "Play Again" : status === "paused" ? "Resume" : "Start Game"}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-[11px] text-[var(--arcade-text-dim)] flex items-center gap-1.5">
        <Trophy className="h-3 w-3" /> Arrow keys / WASD / swipe · Space to pause
      </div>
    </div>
  )
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function ScorePill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex-1 neon-panel rounded-xl px-2.5 py-2 text-center" style={{ borderColor: `${accent}33` }}>
      <div className="text-[10px] tracking-widest text-[var(--arcade-text-dim)]">{label}</div>
      <div className="text-lg font-black tabular-nums" style={{ color: accent }}>{value}</div>
    </div>
  )
}
