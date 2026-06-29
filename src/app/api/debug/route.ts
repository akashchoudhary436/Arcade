import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  console.log("[DEBUG] /api/debug hit at", new Date().toISOString())
  console.log("[DEBUG] NODE_ENV:", process.env.NODE_ENV)
  console.log("[DEBUG] DATABASE_URL present:", !!process.env.DATABASE_URL)
  console.log("[DEBUG] PORT:", process.env.PORT)

  try {
    const { db } = await import("@/lib/db")
    console.log("[DEBUG] db imported, attempting ping...")
    // For MongoDB via Prisma, we can try a lightweight query
    const count = await db.gameScore.count()
    console.log("[DEBUG] gameScore count:", count)
    return NextResponse.json({
      status: "ok",
      nodeEnv: process.env.NODE_ENV,
      dbConnected: true,
      gameScoreCount: count,
      timestamp: new Date().toISOString(),
    })
  } catch (e: unknown) {
    console.error("[DEBUG] db error:", e)
    return NextResponse.json(
      {
        status: "error",
        nodeEnv: process.env.NODE_ENV,
        dbConnected: false,
        error: e instanceof Error ? e.message : String(e),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"
