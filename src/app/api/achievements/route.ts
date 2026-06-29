import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  console.log("[ACHIEVEMENTS API] GET hit at", new Date().toISOString())
  try {
    const playerName = req.nextUrl.searchParams.get("playerName")
    if (!playerName) {
      return NextResponse.json({ achievements: [] })
    }
    const rows = await db.achievement.findMany({
      where: { playerName },
      orderBy: { unlockedAt: "desc" },
    })
    return NextResponse.json({ achievements: rows })
  } catch (e) {
    console.error("[ACHIEVEMENTS API] GET error:", e)
    return NextResponse.json({ achievements: [], error: "db_unavailable" })
  }
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
    await db.achievement
      .create({
        data: { playerName, achievementId },
      })
      .catch(() => null)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[ACHIEVEMENTS API] POST error:", e)
    return NextResponse.json(
      { error: "db_unavailable" },
      { status: 200 }
    )
  }
}
