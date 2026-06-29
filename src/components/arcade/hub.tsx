"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GAMES } from "@/lib/games-config"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import type { GameId } from "@/lib/game-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useHighScores } from "@/hooks/use-high-scores"
import { LeaderboardDialog } from "./leaderboard"
import {
  ChevronRight,
  Play,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
} from "lucide-react"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export function Hub() {
  if (typeof window !== "undefined") {
    console.log("[HUB] Hub mounted, playedGames:", useGameStore.getState().playedGames)
  }
  const { navigateToGame, playedGames, unlockedAchievements } = useGameStore()
  const [howTo, setHowTo] = useState<GameId | null>(null)
  const [lbOpen, setLbOpen] = useState(false)
  const { scores } = useHighScores(undefined, 5)

  const topScore = scores[0]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
      {/* Hero */}
      <section className="pt-8 sm:pt-14 pb-6 text-center">
        <div className="inline-flex items-center gap-2 neon-panel rounded-full px-3 py-1 text-xs text-[var(--arcade-text-dim)] mb-5 animate-slide-up">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--arcade-emerald)] animate-pulse" />
          6 games · endless high scores · pure neon
        </div>
        <h1 className="arcade-title font-black text-5xl sm:text-7xl md:text-8xl tracking-tighter leading-[0.95] animate-slide-up">
          NEON
          <br />
          ARCADE
        </h1>
        <p
          className="mt-5 text-[var(--arcade-text-dim)] max-w-xl mx-auto text-sm sm:text-base animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          A pocket arcade of glowing, retro-inspired browser games. Pick a
          cabinet, drop in a coin, and chase your name up the leaderboard.
        </p>
        <div
          className="mt-7 flex items-center justify-center gap-2 flex-wrap animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <Button
            onClick={() => navigateToGame("snake")}
            className="bg-[var(--arcade-accent)] text-black hover:opacity-90 gap-2 px-6 font-semibold"
          >
            <Flame className="h-4 w-4" />
            Quick Play
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setLbOpen(true)
              sound.play("click")
            }}
            className="arcade-btn gap-2"
          >
            <Trophy className="h-4 w-4" style={{ color: "var(--arcade-amber)" }} />
            Leaderboard
          </Button>
        </div>

        {/* Stat strip */}
        <div
          className="mt-9 grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <HeroStat label="Games" value={`${playedGames.length}/6`} accent="var(--arcade-cyan)" />
          <HeroStat
            label="Trophies"
            value={`${unlockedAchievements.length}`}
            accent="var(--arcade-amber)"
          />
          <HeroStat
            label="Top Score"
            value={topScore ? String(topScore.score) : "—"}
            accent="var(--arcade-magenta)"
          />
        </div>
      </section>

      {/* Game cabinets */}
      <section className="mt-8">
        <div className="flex items-end justify-between mb-4 px-1">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: "var(--arcade-accent)" }} />
            Choose a Cabinet
          </h2>
          <span className="text-xs text-[var(--arcade-text-dim)] hidden sm:block">
            tap a card to play
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((g, i) => {
            const Icon = g.icon
            const played = playedGames.includes(g.id)
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                role="button"
                tabIndex={0}
                onClick={() => navigateToGame(g.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    navigateToGame(g.id)
                  }
                }}
                onMouseEnter={() => sound.play("hover")}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="group relative text-left rounded-2xl p-5 neon-panel border-[var(--arcade-border)] overflow-hidden cursor-pointer focus:outline-none focus-visible:neon-ring"
              >
                {/* glow blob */}
                <div
                  className="absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-25 group-hover:opacity-50 transition-opacity"
                  style={{ background: g.color }}
                />
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 1px ${g.color}55, 0 0 30px -8px ${g.color}`,
                  }}
                />

                <div className="relative flex items-start justify-between">
                  <div
                    className="grid place-items-center h-12 w-12 rounded-xl text-2xl"
                    style={{
                      background: `${g.color}1a`,
                      border: `1px solid ${g.color}40`,
                      color: g.color,
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {played ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] gap-1 bg-[var(--arcade-emerald)]/15 text-[var(--arcade-emerald)] border-[var(--arcade-emerald)]/30"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--arcade-emerald)]" />
                        PLAYED
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-white/5 text-[var(--arcade-text-dim)] border-[var(--arcade-border)]"
                      >
                        NEW
                      </Badge>
                    )}
                  </div>
                </div>

                <h3 className="relative mt-4 text-xl font-bold tracking-tight">
                  {g.title}
                </h3>
                <p className="relative text-sm text-[var(--arcade-text-dim)] mt-0.5">
                  {g.tagline}
                </p>

                <div className="relative mt-4 flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-white/5 text-[var(--arcade-text-dim)] border-[var(--arcade-border)]"
                  >
                    {g.category}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-[10px] gap-1 border-[var(--arcade-border)]"
                    style={{
                      color: g.color,
                      background: `${g.color}14`,
                    }}
                  >
                    {g.difficulty}
                  </Badge>
                </div>

                <div className="relative mt-5 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setHowTo(g.id)
                      sound.play("click")
                    }}
                    className="text-xs text-[var(--arcade-text-dim)] hover:text-[var(--arcade-text)] transition-colors"
                  >
                    How to play →
                  </button>
                  <span
                    className="flex items-center gap-1 text-sm font-bold transition-all group-hover:gap-2"
                    style={{ color: g.color }}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Play
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* How to play dialog */}
      <HowToDialog gameId={howTo} onClose={() => setHowTo(null)} onPlay={(id) => navigateToGame(id)} />

      <LeaderboardDialog open={lbOpen} onOpenChange={setLbOpen} />
    </div>
  )
}

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="neon-panel rounded-xl p-3 text-center">
      <div
        className="text-2xl sm:text-3xl font-black tabular-nums"
        style={{ color: accent, textShadow: `0 0 16px ${accent}66` }}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--arcade-text-dim)] mt-1">
        {label}
      </div>
    </div>
  )
}

function HowToDialog({
  gameId,
  onClose,
  onPlay,
}: {
  gameId: GameId | null
  onClose: () => void
  onPlay: (id: GameId) => void
}) {
  const game = gameId ? GAMES.find((g) => g.id === gameId) : null
  return (
    <Dialog open={!!game} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="neon-panel border-[var(--arcade-border)] text-[var(--arcade-text)]">
        {game && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span
                  className="grid place-items-center h-10 w-10 rounded-xl"
                  style={{
                    background: `${game.color}1a`,
                    border: `1px solid ${game.color}40`,
                    color: game.color,
                  }}
                >
                  <game.icon className="h-5 w-5" />
                </span>
                {game.title}
              </DialogTitle>
              <DialogDescription className="text-[var(--arcade-text-dim)] pt-1">
                {game.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <div className="text-xs uppercase tracking-wider text-[var(--arcade-text-dim)] mb-2">
                How to play
              </div>
              {game.howToPlay.map((line, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span
                    className="grid place-items-center h-6 w-6 shrink-0 rounded-full text-xs font-bold"
                    style={{
                      background: `${game.color}1a`,
                      color: game.color,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-[var(--arcade-text)]/90">{line}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} className="arcade-btn">
                Close
              </Button>
              <Button
                onClick={() => {
                  onClose()
                  onPlay(game.id)
                }}
                className="gap-2 text-black"
                style={{ background: game.color }}
              >
                Start Game
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
