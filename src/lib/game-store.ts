"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { GameId } from "./game-types"
import { sound } from "./sound"

export type View = "hub" | "game"
export type Theme = "neon" | "retro" | "cyber"

const AVATARS = ["👾", "🤖", "🦊", "🐱", "🐉", "🦉", "🦅", "🦄", "🐼", "🐯"]

interface ScorePayload {
  gameId: GameId
  score: number
  duration?: number
  meta?: Record<string, unknown>
}

interface GameState {
  // navigation
  view: View
  currentGame: GameId | null
  // profile (persisted)
  playerName: string
  avatar: string
  // settings (persisted)
  theme: Theme
  soundEnabled: boolean
  volume: number
  // local stats (persisted)
  playedGames: GameId[]
  scoresSubmitted: number
  unlockedAchievements: string[]

  // actions
  navigateToGame: (id: GameId) => void
  exitToHub: () => void
  setProfile: (name: string, avatar: string) => void
  setTheme: (t: Theme) => void
  toggleSound: () => void
  setVolume: (v: number) => void
  submitScore: (p: ScorePayload) => Promise<void>
  unlockAchievement: (id: string) => Promise<void>
  resetProfile: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      view: "hub",
      currentGame: null,
      playerName: "Player1",
      avatar: AVATARS[0],
      theme: "neon",
      soundEnabled: true,
      volume: 0.35,
      playedGames: [],
      scoresSubmitted: 0,
      unlockedAchievements: [],

      navigateToGame: (id) => {
        sound.play("start")
        const played = get().playedGames
        const next = played.includes(id) ? played : [...played, id]
        set({ view: "game", currentGame: id, playedGames: next })
        if (next.length >= 1) void get().unlockAchievement("first_step")
        if (next.length >= 4) void get().unlockAchievement("arcade_rat")
        const hour = new Date().getHours()
        if (hour >= 0 && hour < 5) void get().unlockAchievement("night_owl")
      },
      exitToHub: () => {
        sound.play("click")
        set({ view: "hub", currentGame: null })
      },
      setProfile: (name, avatar) =>
        set({ playerName: name.trim() || "Player1", avatar }),
      setTheme: (t) => set({ theme: t }),
      toggleSound: () => {
        const next = !get().soundEnabled
        sound.setEnabled(next)
        set({ soundEnabled: next })
        if (next) sound.play("click")
      },
      setVolume: (v) => {
        sound.setVolume(v)
        set({ volume: v })
      },
      submitScore: async ({ gameId, score, duration, meta }) => {
        const { playerName, scoresSubmitted } = get()
        try {
          await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gameId,
              playerName,
              score,
              duration: duration ?? null,
              meta: meta ? JSON.stringify(meta) : null,
            }),
          })
        } catch {
          /* ignore network errors */
        }
        set({ scoresSubmitted: scoresSubmitted + 1 })
        if (scoresSubmitted + 1 >= 10)
          void get().unlockAchievement("score_hunter")
      },
      unlockAchievement: async (id) => {
        const { unlockedAchievements, playerName } = get()
        if (unlockedAchievements.includes(id)) return
        set({ unlockedAchievements: [...unlockedAchievements, id] })
        sound.play("achievement")
        try {
          await fetch("/api/achievements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerName, achievementId: id }),
          })
        } catch {
          /* ignore */
        }
        // Defer toast to avoid import cycles in SSR; fire via window event.
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("arcade:achievement", { detail: id })
          )
        }
      },
      resetProfile: () =>
        set({
          playerName: "Player1",
          avatar: AVATARS[0],
          playedGames: [],
          scoresSubmitted: 0,
          unlockedAchievements: [],
        }),
    }),
    {
      name: "neon-arcade",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        playerName: s.playerName,
        avatar: s.avatar,
        theme: s.theme,
        soundEnabled: s.soundEnabled,
        volume: s.volume,
        playedGames: s.playedGames,
        scoresSubmitted: s.scoresSubmitted,
        unlockedAchievements: s.unlockedAchievements,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          sound.setEnabled(state.soundEnabled)
          sound.setVolume(state.volume)
        }
      },
    }
  )
)

export { AVATARS }
