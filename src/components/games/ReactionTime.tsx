"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import { Button } from "@/components/ui/button"
import { Zap, RotateCcw, Trophy } from "lucide-react"
import type { GameProps } from "@/lib/game-types"

type Phase = "idle" | "waiting" | "ready" | "tooSoon" | "result" | "done"
const ROUNDS = 5

export function ReactionTime({}: GameProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState<number[]>([])
  const [last, setLast] = useState<number | null>(null)
  const goAtRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const submittedRef = useRef(false)

  const { submitScore, unlockAchievement } = useGameStore()

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }
  useEffect(() => () => clearTimer(), [])

  const startRound = useCallback(() => {
    setPhase("waiting")
    setLast(null)
    sound.play("click")
    const delay = 1200 + Math.random() * 3000
    timeoutRef.current = setTimeout(() => {
      goAtRef.current = performance.now()
      setPhase("ready")
      sound.play("tick")
    }, delay)
  }, [])

  const handleClick = () => {
    if (phase === "idle" || phase === "done") {
      // begin fresh
      setTimes([])
      setRound(0)
      submittedRef.current = false
      startRound()
      return
    }
    if (phase === "waiting") {
      // too soon
      clearTimer()
      sound.play("lose")
      setPhase("tooSoon")
      return
    }
    if (phase === "tooSoon") {
      startRound()
      return
    }
    if (phase === "ready") {
      const rt = Math.round(performance.now() - goAtRef.current)
      sound.play("eat")
      setLast(rt)
      const newTimes = [...times, rt]
      setTimes(newTimes)
      const nextRound = round + 1
      setRound(nextRound)
      if (nextRound >= ROUNDS) {
        setPhase("done")
        const best = Math.min(...newTimes)
        if (best < 300) void unlockAchievement("reflex_sub300")
        if (best < 200) void unlockAchievement("reflex_sub200")
        if (!submittedRef.current) {
          submittedRef.current = true
          void submitScore({
            gameId: "reaction",
            score: best,
            duration: newTimes.reduce((a, b) => a + b, 0),
            meta: { rounds: ROUNDS, times: newTimes },
          })
        }
      } else {
        setPhase("result")
      }
      return
    }
    if (phase === "result") {
      startRound()
      return
    }
  }

  const reset = () => {
    clearTimer()
    setPhase("idle")
    setRound(0)
    setTimes([])
    setLast(null)
    submittedRef.current = false
    sound.play("start")
  }

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
  const best = times.length ? Math.min(...times) : 0

  const palette: Record<Phase, { bg: string; fg: string; title: string; sub: string }> = {
    idle: {
      bg: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(34,211,238,0.14))",
      fg: "var(--arcade-violet)",
      title: "Reaction Rush",
      sub: "Click Start. Wait for green. Tap as fast as you can. 5 rounds.",
    },
    waiting: {
      bg: "linear-gradient(135deg, rgba(251,113,133,0.22), rgba(180,83,9,0.18))",
      fg: "var(--arcade-red)",
      title: "Wait for green…",
      sub: "Don't click yet!",
    },
    ready: {
      bg: "linear-gradient(135deg, rgba(52,211,153,0.35), rgba(16,185,129,0.25))",
      fg: "#bbf7d0",
      title: "CLICK!",
      sub: "NOW!",
    },
    tooSoon: {
      bg: "linear-gradient(135deg, rgba(251,113,133,0.3), rgba(220,38,38,0.2))",
      fg: "var(--arcade-red)",
      title: "Too soon!",
      sub: "Click to retry this round.",
    },
    result: {
      bg: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.16))",
      fg: "var(--arcade-cyan)",
      title: `${last} ms`,
      sub: `Round ${round}/${ROUNDS} done. Click for next round.`,
    },
    done: {
      bg: "linear-gradient(135deg, rgba(251,191,36,0.22), rgba(240,171,252,0.16))",
      fg: "var(--arcade-amber)",
      title: "Complete!",
      sub: "See your results below.",
    },
  }
  const p = palette[phase]

  return (
    <div className="flex flex-col items-center gap-4">
      {/* stats */}
      <div className="flex items-center gap-2 w-full max-w-[480px]">
        <Stat label="ROUND" value={`${Math.min(round + (phase === "done" ? 0 : phase === "result" ? 0 : 1), ROUNDS)}/${ROUNDS}`} accent="var(--arcade-cyan)" />
        <Stat label="LAST" value={last ? `${last}ms` : "—"} accent="var(--arcade-violet)" />
        <Stat label="AVG" value={avg ? `${avg}ms` : "—"} accent="var(--arcade-amber)" />
        <Stat label="BEST" value={best ? `${best}ms` : "—"} accent="var(--arcade-emerald)" />
      </div>

      {/* the pad */}
      <button
        onClick={handleClick}
        className="relative w-full max-w-[480px] aspect-[2/1] rounded-2xl grid place-items-center transition-all active:scale-[0.99]"
        style={{
          background: p.bg,
          border: `1px solid ${p.fg}55`,
          boxShadow: `0 0 40px -12px ${p.fg}, inset 0 0 50px -20px ${p.fg}`,
        }}
      >
        <div className="text-center px-6">
          <div className="text-4xl sm:text-5xl font-black mb-1" style={{ color: p.fg, textShadow: `0 0 20px ${p.fg}` }}>
            {phase === "ready" && <Zap className="inline h-10 w-10 mr-2" />}
            {p.title}
          </div>
          <div className="text-sm text-[var(--arcade-text-dim)]">{p.sub}</div>
        </div>

        {/* round dots */}
        <div className="absolute bottom-3 flex gap-1.5">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === round && phase !== "done" ? 18 : 8,
                background: i < times.length ? "var(--arcade-emerald)" : i === round && phase !== "idle" ? p.fg : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </button>

      {/* results / controls */}
      {phase === "done" ? (
        <div className="w-full max-w-[480px] neon-panel rounded-2xl p-4 animate-pop">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5" style={{ color: "var(--arcade-amber)" }} />
              Results
            </div>
            <Button size="sm" onClick={reset} className="arcade-btn gap-1.5">
              <RotateCcw className="h-4 w-4" /> Again
            </Button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {times.map((t, i) => {
              const color = t < 250 ? "var(--arcade-emerald)" : t < 400 ? "var(--arcade-amber)" : "var(--arcade-red)"
              return (
                <div key={i} className="rounded-lg p-2 text-center" style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
                  <div className="text-[9px] text-[var(--arcade-text-dim)]">R{i + 1}</div>
                  <div className="text-sm font-black tabular-nums" style={{ color }}>{t}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg p-2 neon-panel">
              <div className="text-[10px] tracking-widest text-[var(--arcade-text-dim)]">AVERAGE</div>
              <div className="text-xl font-black" style={{ color: "var(--arcade-cyan)" }}>{avg}ms</div>
            </div>
            <div className="rounded-lg p-2 neon-panel" style={{ borderColor: "var(--arcade-emerald)55" }}>
              <div className="text-[10px] tracking-widest text-[var(--arcade-text-dim)]">BEST</div>
              <div className="text-xl font-black" style={{ color: "var(--arcade-emerald)" }}>{best}ms</div>
            </div>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={reset} className="arcade-btn gap-1.5">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      )}

      <div className="text-[11px] text-[var(--arcade-text-dim)]">
        Average human reaction time is ~250ms. Sub-200ms is superhuman.
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="flex-1 neon-panel rounded-xl px-2 py-2 text-center" style={{ borderColor: `${accent}33` }}>
      <div className="text-[9px] tracking-widest text-[var(--arcade-text-dim)]">{label}</div>
      <div className="text-base font-black tabular-nums" style={{ color: accent }}>{value}</div>
    </div>
  )
}
