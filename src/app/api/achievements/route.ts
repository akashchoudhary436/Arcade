import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  console.log("[ACHIEVEMENTS API] GET hit at", new Date().toISOString())
  const playerName = req.nextUrl.searchParams.get("playerName")
  if (!playerName) {
    return NextResponse.json({ achievements: [] })
  }
  const rows = await db.achievement.findMany({
    where: { playerName },
    orderBy: { unlockedAt: "desc" },
  })
  return NextResponse.json({ achievements: rows })
}

export async function POST(req: NextRequest) {
  try {
    const { playerName, achievementId } = (await req.json()) as {
      playerName: string
      achievementId: string
    }
    if (!playerName || !achievementId) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 })
    }
    const created = await db.achievement
      .create({
        data: { playerName, achievementId },
      })
      .catch(() => null) // unique constraint → already exists
    return NextResponse.json({ ok: true, created: !!created })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}
