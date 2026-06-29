"use client"

import { useEffect, useState, useCallback } from "react"
import type { GameId, ScoreEntry } from "@/lib/game-types"

export function useHighScores(gameId?: GameId, limit = 10) {
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    let active = true
    const params = new URLSearchParams({ limit: String(limit) })
    if (gameId) params.set("gameId", gameId)
    fetch(`/api/scores?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.scores) setScores(d.scores)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [gameId, limit, version])

  return { scores, loading, refresh }
}
