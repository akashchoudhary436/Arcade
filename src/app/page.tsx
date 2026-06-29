"use client"

import dynamic from "next/dynamic"

const ArcadeShell = dynamic(
  () => import("@/components/arcade/arcade-shell").then((m) => m.ArcadeShell),
  { ssr: false }
)

export default function Home() {
  return <ArcadeShell />
}
