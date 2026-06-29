import { test, expect } from "@playwright/test"

test.describe("Neon Arcade E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000")
  })

  test("homepage shows hero and game cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "NEON ARCADE" }).first()).toBeVisible()
    await expect(page.getByText("Neon Snake")).toBeVisible()
    await expect(page.getByText("2048 Fusion")).toBeVisible()
    await expect(page.getByText("Memory Matrix")).toBeVisible()
    await expect(page.getByText("Tic-Tac-Toe AI")).toBeVisible()
    await expect(page.getByText("Reaction Rush")).toBeVisible()
    await expect(page.getByText("Whack-a-Mole")).toBeVisible()
  })

  test("navigates into and out of snake game", async ({ page }) => {
    await page.getByText("Neon Snake").click()
    await expect(page.getByText("Neon Snake").first()).toBeVisible()
    await page.getByRole("button", { name: "Arcade" }).last().click()
    await expect(page.getByRole("heading", { name: "NEON ARCADE" }).first()).toBeVisible()
  })

  test("navigates into 2048 game", async ({ page }) => {
    await page.getByText("2048 Fusion").click()
    await expect(page.getByText("2048 Fusion").first()).toBeVisible()
  })

  test("profile bar renders sound toggle and theme selector", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Settings" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Mute" })).toBeVisible()
  })
})
