import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { GameId } from "@/lib/game-types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  console.log("[SCORES API] GET hit at", new Date().toISOString())
  const gameId = req.nextUrl.searchParams.get("gameId") as GameId | null
  const limit = Math.min(
    50,
    parseInt(req.nextUrl.searchParams.get("limit") || "10", 10)
  )

  const where = gameId ? { gameId } : {}
  const scores = await db.gameScore.findMany({
    where,
    orderBy: { score: "desc" },
    take: limit,
  })
  return NextResponse.json({ scores })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gameId, playerName, score, duration, meta } = body as {
      gameId: GameId
      playerName: string
      score: number
      duration: number | null
      meta: string | null
    }
    if (!gameId || !playerName || typeof score !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    const created = await db.gameScore.create({
      data: {
        gameId,
        playerName: String(playerName).slice(0, 24),
        score: Math.round(score),
        duration: duration ?? null,
        meta: meta ?? null,
      },
    })
    return NextResponse.json({ ok: true, id: created.id })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}
