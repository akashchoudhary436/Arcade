"use client"

import { lazy, Suspense } from "react"
import { useGameStore } from "@/lib/game-store"
import { ProfileBar } from "./profile-bar"
import { Hub } from "./hub"
import { GameFrame } from "./game-frame"
import { AchievementListener } from "./achievement-listener"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Gamepad2, Github, Heart } from "lucide-react"

const Game2048 = lazy(() => import("@/components/games/Game2048").then((m) => ({ default: m.Game2048 })))
const SnakeGame = lazy(() => import("@/components/games/SnakeGame").then((m) => ({ default: m.SnakeGame })))
const MemoryMatch = lazy(() => import("@/components/games/MemoryMatch").then((m) => ({ default: m.MemoryMatch })))
const TicTacToe = lazy(() => import("@/components/games/TicTacToe").then((m) => ({ default: m.TicTacToe })))
const ReactionTime = lazy(() => import("@/components/games/ReactionTime").then((m) => ({ default: m.ReactionTime })))
const WhackAMole = lazy(() => import("@/components/games/WhackAMole").then((m) => ({ default: m.WhackAMole })))

function GameLoader() {
  return (
    <div className="grid place-items-center h-64 text-[var(--arcade-text-dim)]">
      <div className="flex flex-col items-center gap-3">
        <Gamepad2 className="h-10 w-10 animate-spin-slow" style={{ color: "var(--arcade-accent)" }} />
        <div className="text-sm">Loading cabinet…</div>
      </div>
    </div>
  )
}

export function ArcadeShell() {
  const { view, currentGame, theme, exitToHub } = useGameStore()

  if (typeof window !== "undefined") {
    console.log("[SHELL] ArcadeShell mounted, view:", view, "game:", currentGame)
  }

  return (
    <div
      className={`arcade arcade-grid arcade-scanlines min-h-screen flex flex-col`}
      data-theme={theme}
    >
      <ProfileBar />
      <main className="flex-1">
        {view === "hub" || !currentGame ? (
          <Hub />
        ) : (
          <GameFrame gameId={currentGame}>
            <Suspense fallback={<GameLoader />}>
              {currentGame === "snake" && <SnakeGame onExit={exitToHub} />}
              {currentGame === "2048" && <Game2048 onExit={exitToHub} />}
              {currentGame === "memory" && <MemoryMatch onExit={exitToHub} />}
              {currentGame === "tictactoe" && <TicTacToe onExit={exitToHub} />}
              {currentGame === "reaction" && <ReactionTime onExit={exitToHub} />}
              {currentGame === "whack" && <WhackAMole onExit={exitToHub} />}
            </Suspense>
          </GameFrame>
        )}
      </main>

      <footer className="mt-auto neon-panel border-x-0 border-b-0 px-4 sm:px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--arcade-text-dim)]">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" style={{ color: "var(--arcade-accent)" }} />
            <span>
              <span className="font-bold text-[var(--arcade-text)]">NEON ARCADE</span>{" "}
              · built with Next.js + Web Audio
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              Made with <Heart className="h-3 w-3" style={{ color: "var(--arcade-pink)" }} /> for retro gamers
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Github className="h-3.5 w-3.5" /> open-source friendly
            </span>
          </div>
        </div>
      </footer>

      <AchievementListener />
      <SonnerToaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "rgba(20,18,40,0.95)",
            border: "1px solid var(--arcade-border)",
            color: "var(--arcade-text)",
          },
        }}
      />
    </div>
  )
}
