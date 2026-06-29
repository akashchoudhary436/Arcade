"use client"

import { useState, type ReactNode } from "react"
import type { GameId } from "@/lib/game-types"
import { GAME_MAP } from "@/lib/games-config"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LeaderboardDialog } from "./leaderboard"
import { ArrowLeft, Info, Trophy } from "lucide-react"

export function GameFrame({
  gameId,
  children,
  toolbar,
}: {
  gameId: GameId
  children: ReactNode
  toolbar?: ReactNode
}) {
  const game = GAME_MAP[gameId]
  const { exitToHub } = useGameStore()
  const [howTo, setHowTo] = useState(false)
  const [lbOpen, setLbOpen] = useState(false)
  const Icon = game.icon

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 pb-20 sm:pb-28">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={exitToHub}
          className="arcade-btn gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Arcade</span>
        </Button>

        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="grid place-items-center h-9 w-9 rounded-lg shrink-0"
            style={{
              background: `${game.color}1a`,
              border: `1px solid ${game.color}40`,
              color: game.color,
            }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div
              className="font-bold leading-none truncate"
              style={{ color: game.color }}
            >
              {game.title}
            </div>
            <div className="text-[11px] text-[var(--arcade-text-dim)] truncate">
              {game.tagline}
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {toolbar}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setHowTo(true)
              sound.play("click")
            }}
            className="arcade-btn"
            aria-label="How to play"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLbOpen(true)
              sound.play("click")
            }}
            className="arcade-btn"
            aria-label="Leaderboard"
          >
            <Trophy
              className="h-4 w-4"
              style={{ color: "var(--arcade-amber)" }}
            />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl neon-panel border-[var(--arcade-border)] p-3 sm:p-5 neon-ring">
        {children}
      </div>

      <Dialog open={howTo} onOpenChange={setHowTo}>
        <DialogContent className="neon-panel border-[var(--arcade-border)] text-[var(--arcade-text)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" style={{ color: game.color }} />
              {game.title} — How to Play
            </DialogTitle>
            <DialogDescription className="text-[var(--arcade-text-dim)]">
              {game.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {game.howToPlay.map((line, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span
                  className="grid place-items-center h-6 w-6 shrink-0 rounded-full text-xs font-bold"
                  style={{ background: `${game.color}1a`, color: game.color }}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[var(--arcade-text)]/90">{line}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <LeaderboardDialog open={lbOpen} onOpenChange={setLbOpen} gameId={gameId} />
    </div>
  )
}
