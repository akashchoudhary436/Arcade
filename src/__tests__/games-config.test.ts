import { describe, it, expect, beforeEach } from "vitest"

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock })

beforeEach(() => {
  localStorageMock.clear()
})

describe("Games configuration", () => {
  it("contains six games", async () => {
    const { GAMES } = await import("@/lib/games-config")
    expect(GAMES).toHaveLength(6)
  })

  it("maps game ids to metadata", async () => {
    const { GAME_MAP } = await import("@/lib/games-config")
    expect(Object.keys(GAME_MAP)).toEqual(
      expect.arrayContaining([
        "snake",
        "2048",
        "memory",
        "tictactoe",
        "reaction",
        "whack",
      ])
    )
  })
})

describe("Sound manager", () => {
  it("exports a sound instance with required methods", async () => {
    const { sound } = await import("@/lib/sound")
    expect(sound).toBeDefined()
    expect(typeof sound.play).toBe("function")
    expect(typeof sound.setEnabled).toBe("function")
    expect(typeof sound.setVolume).toBe("function")
  })

  it("can mute and unmute without throwing", async () => {
    const { sound } = await import("@/lib/sound")
    sound.setEnabled(false)
    expect(sound.enabled).toBe(false)
    sound.setEnabled(true)
    expect(sound.enabled).toBe(true)
  })
})

describe("Game store", () => {
  it("navigates to a game and back to hub", async () => {
    const { useGameStore } = await import("@/lib/game-store")
    const store = useGameStore as any
    store.setState({
      view: "hub",
      currentGame: null,
      playedGames: [],
      scoresSubmitted: 0,
      unlockedAchievements: [],
    })
    store.getState().navigateToGame("snake")
    expect(store.getState().view).toBe("game")
    expect(store.getState().currentGame).toBe("snake")
    expect(store.getState().playedGames).toContain("snake")
    store.getState().exitToHub()
    expect(store.getState().view).toBe("hub")
    expect(store.getState().currentGame).toBeNull()
  })

  it("deduplicates played games", async () => {
    const { useGameStore } = await import("@/lib/game-store")
    const store = useGameStore as any
    store.setState({ playedGames: [], currentGame: null, view: "hub" })
    store.getState().navigateToGame("snake")
    store.getState().exitToHub()
    store.getState().navigateToGame("snake")
    expect(store.getState().playedGames).toEqual(["snake"])
  })

  it("unlocks first_step on first game launch", async () => {
    const { useGameStore } = await import("@/lib/game-store")
    const store = useGameStore as any
    store.setState({
      unlockedAchievements: [],
      playedGames: [],
      currentGame: null,
      view: "hub",
    })
    store.getState().navigateToGame("snake")
    expect(store.getState().unlockedAchievements).toContain("first_step")
  })

  it("does not duplicate achievements", async () => {
    const { useGameStore } = await import("@/lib/game-store")
    const store = useGameStore as any
    store.setState({
      unlockedAchievements: ["first_step"],
      playedGames: ["snake"],
      currentGame: null,
      view: "hub",
    })
    store.getState().exitToHub()
    store.getState().navigateToGame("2048")
    expect(store.getState().unlockedAchievements).toEqual(["first_step"])
  })

  it("toggles sound and sets volume", async () => {
    const { useGameStore } = await import("@/lib/game-store")
    const store = useGameStore as any
    store.setState({ soundEnabled: true, volume: 0.5 })
    store.getState().toggleSound()
    expect(store.getState().soundEnabled).toBe(false)
    store.getState().toggleSound()
    expect(store.getState().soundEnabled).toBe(true)
    store.getState().setVolume(0.8)
    expect(store.getState().volume).toBe(0.8)
  })

  it("sets profile and trims names", async () => {
    const { useGameStore } = await import("@/lib/game-store")
    const store = useGameStore as any
    store.getState().setProfile("  Ace  ", "🐱")
    expect(store.getState().playerName).toBe("Ace")
    expect(store.getState().avatar).toBe("🐱")
    store.getState().setProfile("   ", "👾")
    expect(store.getState().playerName).toBe("Player1")
    expect(store.getState().avatar).toBe("👾")
  })
})
