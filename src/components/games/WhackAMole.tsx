"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import { Button } from "@/components/ui/button"
import { Hammer, RotateCcw, Timer, Target } from "lucide-react"
import type { GameProps } from "@/lib/game-types"

const HOLES = 9
const GAME_SECONDS = 30

type MoleType = "normal" | "golden" | "bomb"
interface Hole {
  active: boolean
  type: MoleType
}

function emptyHoles(): Hole[] {
  return Array.from({ length: HOLES }, () => ({ active: false, type: "normal" as MoleType }))
}

export function WhackAMole({}: GameProps) {
  const [holes, setHoles] = useState<Hole[]>(emptyHoles)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(GAME_SECONDS)
  const [status, setStatus] = useState<"idle" | "running" | "over">("idle")
  const [best, setBest] = useState(() => {
    if (typeof window === "undefined") return 0
    return Number(localStorage.getItem("arcade-whack-best") || "0")
  })
  const [combo, setCombo] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)

  // all refs declared up front (before any function that uses them)
  const runningRef = useRef(false)
  const spawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const countdown = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const timeRef = useRef(GAME_SECONDS)
  const submittedRef = useRef(false)

  const { submitScore, unlockAchievement } = useGameStore()

  useEffect(() => {
    return () => {
      if (spawnTimer.current) clearTimeout(spawnTimer.current)
      if (countdown.current) clearInterval(countdown.current)
      Object.values(hideTimers.current).forEach(clearTimeout)
    }
  }, [])

  const endGame = useCallback(() => {
    runningRef.current = false
    if (spawnTimer.current) clearTimeout(spawnTimer.current)
    if (countdown.current) clearInterval(countdown.current)
    Object.values(hideTimers.current).forEach(clearTimeout)
    hideTimers.current = {}
    setHoles((hs) => hs.map((h) => ({ ...h, active: false })))
    setStatus("over")
    sound.play("lose")
    const s = scoreRef.current
    if (s >= 30) void unlockAchievement("whack_30")
    if (!submittedRef.current) {
      submittedRef.current = true
      void submitScore({
        gameId: "whack",
        score: s,
        duration: GAME_SECONDS * 1000,
        meta: { hits: hitsRef.current, misses: missesRef.current },
      })
    }
  }, [submitScore, unlockAchievement])

  // scheduleSpawn is recursive — keep the latest closure in a ref assigned in an effect.
  const scheduleSpawnRef = useRef<() => void>(() => {})
  useEffect(() => {
    scheduleSpawnRef.current = () => {
      if (!runningRef.current) return
      const elapsed = GAME_SECONDS - timeRef.current
      const speedFactor = Math.max(0.45, 1 - elapsed / 45)
      const delay = (450 + Math.random() * 650) * speedFactor
      spawnTimer.current = setTimeout(() => {
        if (!runningRef.current) return
        setHoles((hs) => {
          const empties = hs.map((h, i) => ({ h, i })).filter((x) => !x.h.active)
          if (empties.length === 0) return hs
          const pick = empties[Math.floor(Math.random() * empties.length)]
          const roll = Math.random()
          const type: MoleType =
            roll < 0.08 ? "golden" : roll < 0.16 ? "bomb" : "normal"
          const nb = [...hs]
          nb[pick.i] = { active: true, type }
          const lifetime =
            (type === "golden" ? 900 : 1100 + Math.random() * 500) * speedFactor
          if (hideTimers.current[pick.i]) clearTimeout(hideTimers.current[pick.i])
          hideTimers.current[pick.i] = setTimeout(() => {
            setHoles((cur) => {
              if (!cur[pick.i].active) return cur
              const copy = [...cur]
              copy[pick.i] = { active: false, type: "normal" }
              return copy
            })
          }, lifetime)
          return nb
        })
        scheduleSpawnRef.current()
      }, delay)
    }
  }, [])

  const start = useCallback(() => {
    scoreRef.current = 0
    hitsRef.current = 0
    missesRef.current = 0
    timeRef.current = GAME_SECONDS
    submittedRef.current = false
    setScore(0)
    setHits(0)
    setMisses(0)
    setCombo(0)
    setTime(GAME_SECONDS)
    setHoles(emptyHoles())
    setStatus("running")
    runningRef.current = true
    sound.play("start")
    countdown.current = setInterval(() => {
      timeRef.current -= 1
      setTime(timeRef.current)
      if (timeRef.current <= 5) sound.play("tick")
      if (timeRef.current <= 0) {
        endGame()
      }
    }, 1000)
    scheduleSpawnRef.current()
  }, [endGame])

  const whack = (i: number) => {
    if (status !== "running") return
    const hole = holes[i]
    if (!hole.active) {
      missesRef.current += 1
      setMisses(missesRef.current)
      setCombo(0)
      return
    }
    if (hideTimers.current[i]) {
      clearTimeout(hideTimers.current[i])
      delete hideTimers.current[i]
    }
    setHoles((hs) => {
      const copy = [...hs]
      copy[i] = { active: false, type: "normal" }
      return copy
    })
    hitsRef.current += 1
    setHits(hitsRef.current)
    const newCombo = combo + 1
    setCombo(newCombo)
    let gained = 1
    if (hole.type === "golden") {
      gained = 5
      sound.play("achievement")
    } else if (hole.type === "bomb") {
      gained = -3
      setCombo(0)
      sound.play("crash")
    } else {
      sound.play("eat")
    }
    const comboBonus = newCombo >= 5 && gained > 0 ? 1 : 0
    const ns = Math.max(0, scoreRef.current + gained + comboBonus)
    scoreRef.current = ns
    setScore(ns)
    if (ns > best) {
      setBest(ns)
      localStorage.setItem("arcade-whack-best", String(ns))
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* stats */}
      <div className="flex items-center gap-2 w-full max-w-[440px]">
        <Stat icon={Target} label="SCORE" value={score} accent="var(--arcade-pink)" />
        <Stat icon={Timer} label="TIME" value={`${time}s`} accent={time <= 5 ? "var(--arcade-red)" : "var(--arcade-cyan)"} />
        <Stat icon={Hammer} label="COMBO" value={`x${combo}`} accent="var(--arcade-amber)" />
      </div>

      {/* field */}
      <div
        className="relative w-full max-w-[440px] rounded-2xl p-4"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(236,72,153,0.12), transparent 60%), rgba(8,8,18,0.7)",
          border: "1px solid var(--arcade-border)",
          boxShadow: "inset 0 0 40px -10px rgba(236,72,153,0.2)",
        }}
      >
        <div className="grid grid-cols-3 gap-3">
          {holes.map((hole, i) => (
            <button
              key={i}
              onPointerDown={() => whack(i)}
              disabled={status !== "running"}
              className="relative aspect-square rounded-full overflow-hidden group"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 30%, #1a1530 0%, #0a0814 70%)",
                border: "2px solid rgba(120,90,180,0.3)",
                boxShadow: "inset 0 8px 16px -4px rgba(0,0,0,0.7)",
              }}
            >
              <div
                className="absolute inset-x-2 top-1 h-2 rounded-full"
                style={{ background: "rgba(0,0,0,0.5)", filter: "blur(2px)" }}
              />
              <div
                className="absolute inset-0 grid place-items-center transition-transform duration-150"
                style={{
                  transform: hole.active ? "translateY(0)" : "translateY(120%)",
                }}
              >
                <span
                  className="text-4xl sm:text-5xl"
                  style={{
                    filter:
                      hole.type === "golden"
                        ? "drop-shadow(0 0 12px #fbbf24)"
                        : hole.type === "bomb"
                        ? "drop-shadow(0 0 10px #fb7185)"
                        : "drop-shadow(0 0 6px rgba(236,72,153,0.5))",
                  }}
                >
                  {hole.type === "golden" ? "🌟" : hole.type === "bomb" ? "💣" : "🐹"}
                </span>
              </div>
              {hole.active && (
                <div
                  className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity"
                  style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3), transparent 60%)" }}
                />
              )}
            </button>
          ))}
        </div>

        {status !== "running" && (
          <div
            className="absolute inset-0 grid place-items-center rounded-2xl z-10"
            style={{ background: "rgba(5,5,12,0.82)", backdropFilter: "blur(3px)" }}
          >
            <div className="text-center px-6">
              {status === "over" ? (
                <>
                  <div className="text-5xl mb-2">🔨</div>
                  <div className="text-2xl font-black mb-1" style={{ color: "var(--arcade-pink)" }}>
                    Time&apos;s Up!
                  </div>
                  <div className="text-sm text-[var(--arcade-text-dim)] mb-1">
                    Score {score} · {hits} hits · {misses} misses
                  </div>
                  <div className="text-xs text-[var(--arcade-text-dim)] mb-4">
                    Best: {Math.max(best, score)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-2 animate-float">🐹</div>
                  <div className="text-2xl font-black mb-1 arcade-title">Whack-a-Mole</div>
                  <div className="text-sm text-[var(--arcade-text-dim)] mb-4 max-w-xs">
                    Bonk moles for 30 seconds. 🌟 golden = +5 · 💣 bomb = -3 · build combos for bonuses!
                  </div>
                </>
              )}
              <Button onClick={start} className="gap-2 text-black" style={{ background: "var(--arcade-pink)" }}>
                <Hammer className="h-4 w-4" />
                {status === "over" ? "Play Again" : "Start Game"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={start} className="arcade-btn gap-1.5">
          <RotateCcw className="h-4 w-4" /> Restart
        </Button>
      </div>

      <div className="text-[11px] text-[var(--arcade-text-dim)]">
        Tap moles the moment they pop. 5-combo gives bonus points. Avoid bombs!
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
    <div className="flex-1 neon-panel rounded-xl px-2.5 py-2 flex items-center gap-2" style={{ borderColor: `${accent}33` }}>
      <Icon className="h-4 w-4" style={{ color: accent }} />
      <div>
        <div className="text-[10px] tracking-widest text-[var(--arcade-text-dim)]">{label}</div>
        <div className="text-base font-black tabular-nums" style={{ color: accent }}>{value}</div>
      </div>
    </div>
  )
}
