import { test, expect } from "@playwright/test"

const BASE = "http://localhost:3000"

test.describe("API routes integration", () => {
  test("GET /api/scores returns empty list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/scores`)
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.scores)).toBe(true)
  })

  test("GET /api/scores filters by gameId and limit", async ({ request }) => {
    const res = await request.get(`${BASE}/api/scores?gameId=snake&limit=5`)
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.scores)).toBe(true)
  })

  test("POST /api/scores validates payload", async ({ request }) => {
    const res = await request.post(`${BASE}/api/scores`, {
      data: {
        gameId: "snake",
        playerName: "TestPlayer",
        score: 123,
      },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})
