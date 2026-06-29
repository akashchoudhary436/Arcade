import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  console.log("[HEALTH] health check at", new Date().toISOString())
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
}

export const dynamic = "force-dynamic"
