"use client"

import { useState } from "react"
import type { GameId } from "@/lib/game-types"
import { GAMES } from "@/lib/games-config"
import { useHighScores } from "@/hooks/use-high-scores"
import { useGameStore } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Medal } from "lucide-react"

export function LeaderboardDialog({
  open,
  onOpenChange,
  gameId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  gameId?: GameId
}) {
  const [active, setActive] = useState<GameId | "all">(gameId ?? "all")
  const { scores, loading } = useHighScores(
    active === "all" ? undefined : active,
    15
  )
  const { playerName } = useGameStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neon-panel border-[var(--arcade-border)] text-[var(--arcade-text)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" style={{ color: "var(--arcade-amber)" }} />
            Leaderboard
          </DialogTitle>
          <DialogDescription className="text-[var(--arcade-text-dim)]">
            Top scores across the arcade. Climb the ranks!
          </DialogDescription>
        </DialogHeader>

        <Tabs value={active} onValueChange={(v) => {
          setActive(v as GameId | "all")
          sound.play("click")
        }}>
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <TabsList className="bg-transparent h-auto p-1 gap-1 flex">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[var(--arcade-accent)] data-[state=active]:text-black"
              >
                All
              </TabsTrigger>
              {GAMES.map((g) => (
                <TabsTrigger
                  key={g.id}
                  value={g.id}
                  className="data-[state=active]:bg-[var(--arcade-accent)] data-[state=active]:text-black"
                >
                  {g.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </Tabs>

        <div className="mt-2 max-h-[50vh] overflow-y-auto arcade-scroll space-y-1.5 pr-1">
          {loading ? (
            <div className="text-center py-8 text-[var(--arcade-text-dim)] text-sm">
              Loading scores…
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-10 text-[var(--arcade-text-dim)]">
              <div className="text-4xl mb-2">🎮</div>
              <div className="text-sm">No scores yet. Be the first!</div>
            </div>
          ) : (
            scores.map((s, i) => {
              const meta = GAMES.find((g) => g.id === s.gameId)
              const isMe = s.playerName === playerName
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
                    isMe
                      ? "border-[var(--arcade-accent)]/50 neon-ring"
                      : "border-[var(--arcade-border)]"
                  } neon-panel`}
                >
                  <div className="w-8 text-center font-black">
                    {i === 0 ? (
                      <Medal className="h-5 w-5 mx-auto" style={{ color: "#fbbf24" }} />
                    ) : i === 1 ? (
                      <Medal className="h-5 w-5 mx-auto" style={{ color: "#cbd5e1" }} />
                    ) : i === 2 ? (
                      <Medal className="h-5 w-5 mx-auto" style={{ color: "#d97706" }} />
                    ) : (
                      <span className="text-[var(--arcade-text-dim)]">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate flex items-center gap-2">
                      {s.playerName}
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--arcade-accent)]/20 text-[var(--arcade-accent)]">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--arcade-text-dim)]">
                      {meta?.title} · {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    className="text-lg font-black tabular-nums"
                    style={{ color: meta?.color ?? "var(--arcade-accent)" }}
                  >
                    {s.score}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
