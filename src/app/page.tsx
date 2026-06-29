"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"

const ArcadeShell = dynamic(
  () => import("@/components/arcade/arcade-shell").then((m) => m.ArcadeShell),
  { ssr: false }
)

export default function Home() {
  if (typeof window !== "undefined") {
    console.log("[PAGE] Home client component mounted at", new Date().toISOString())
    console.log("[PAGE] User Agent:", navigator.userAgent)
  }

  return <ArcadeShell />
}
