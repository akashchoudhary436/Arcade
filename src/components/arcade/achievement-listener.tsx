"use client"

import { useEffect } from "react"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { toast } from "sonner"

export function AchievementListener() {
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      const def = ACHIEVEMENTS.find((a) => a.id === id)
      if (!def) return
      toast.success("Achievement Unlocked!", {
        description: `${def.icon}  ${def.title} — ${def.description}`,
        duration: 4500,
        style: {
          background: "rgba(20,18,40,0.95)",
          border: "1px solid rgba(251,191,36,0.5)",
          color: "#fff",
          boxShadow: "0 0 24px -4px rgba(251,191,36,0.6)",
        },
      })
    }
    window.addEventListener("arcade:achievement", handler)
    return () => window.removeEventListener("arcade:achievement", handler)
  }, [])

  return null
}
