"use client"

import { useState } from "react"
import { useGameStore, AVATARS } from "@/lib/game-store"
import { sound } from "@/lib/sound"
import type { Theme } from "@/lib/game-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Volume2,
  VolumeX,
  Settings,
  Trophy,
  User,
  Palette,
  Crown,
  Sparkles,
} from "lucide-react"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { GAMES } from "@/lib/games-config"
import { useHighScores } from "@/hooks/use-high-scores"
import { toast } from "sonner"

const THEME_OPTIONS: { id: Theme; label: string; swatch: string }[] = [
  { id: "neon", label: "Neon", swatch: "linear-gradient(90deg,#22d3ee,#f0abfc)" },
  { id: "retro", label: "Retro", swatch: "linear-gradient(90deg,#fbbf24,#fb7185)" },
  { id: "cyber", label: "Cyber", swatch: "linear-gradient(90deg,#34d399,#a78bfa)" },
]

export function ProfileBar() {
  const {
    playerName,
    avatar,
    theme,
    soundEnabled,
    volume,
    toggleSound,
    setVolume,
    setTheme,
    setProfile,
    scoresSubmitted,
    unlockedAchievements,
    playedGames,
  } = useGameStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState(playerName)
  const [avatarDraft, setAvatarDraft] = useState(avatar)
  const [achOpen, setAchOpen] = useState(false)

  const openProfile = () => {
    setNameDraft(playerName)
    setAvatarDraft(avatar)
    setProfileOpen(true)
    sound.play("click")
  }

  const saveProfile = () => {
    setProfile(nameDraft, avatarDraft)
    sound.play("click")
    setProfileOpen(false)
    toast.success("Profile updated")
  }

  return (
    <header className="sticky top-0 z-40">
      <div className="neon-panel border-x-0 border-t-0 px-3 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => sound.play("hover")}
          className="flex items-center gap-2.5 group"
          aria-label="Neon Arcade home"
        >
          <span
            className="grid place-items-center h-10 w-10 rounded-xl text-xl animate-float"
            style={{
              background:
                "linear-gradient(135deg, var(--arcade-accent), var(--arcade-accent-2))",
              boxShadow: "0 0 18px -2px var(--arcade-accent)",
            }}
          >
            🕹️
          </span>
          <div className="text-left leading-none">
            <div className="arcade-title font-black text-lg sm:text-xl tracking-tight">
              NEON ARCADE
            </div>
            <div className="text-[10px] sm:text-xs text-[var(--arcade-text-dim)] tracking-[0.25em] uppercase">
              insert coin to play
            </div>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Badge
            variant="secondary"
            className="hidden md:flex gap-1.5 neon-panel border-[var(--arcade-border)] bg-transparent text-[var(--arcade-text-dim)]"
          >
            <Sparkles className="h-3 w-3" style={{ color: "var(--arcade-amber)" }} />
            {scoresSubmitted} scores
          </Badge>
          <Badge
            variant="secondary"
            className="hidden md:flex gap-1.5 neon-panel border-[var(--arcade-border)] bg-transparent text-[var(--arcade-text-dim)]"
          >
            <Trophy className="h-3 w-3" style={{ color: "var(--arcade-amber)" }} />
            {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </Badge>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAchOpen(true)
              sound.play("click")
            }}
            className="arcade-btn gap-1.5"
            aria-label="Achievements"
          >
            <Trophy className="h-4 w-4" style={{ color: "var(--arcade-amber)" }} />
            <span className="hidden sm:inline">Trophies</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleSound}
            className="arcade-btn"
            aria-label={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" style={{ color: "var(--arcade-accent)" }} />
            ) : (
              <VolumeX className="h-4 w-4 text-[var(--arcade-text-dim)]" />
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSettingsOpen(true)
              sound.play("click")
            }}
            className="arcade-btn"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <button
            onClick={openProfile}
            className="arcade-btn flex items-center gap-2 rounded-lg px-2.5 py-1.5"
            aria-label="Player profile"
          >
            <span
              className="grid place-items-center h-7 w-7 rounded-lg text-lg"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--arcade-border)",
              }}
            >
              {avatar}
            </span>
            <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate">
              {playerName}
            </span>
          </button>
        </div>
      </div>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="neon-panel border-[var(--arcade-border)] text-[var(--arcade-text)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" style={{ color: "var(--arcade-accent)" }} />
              Settings
            </DialogTitle>
            <DialogDescription className="text-[var(--arcade-text-dim)]">
              Customize your arcade experience.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Palette className="h-4 w-4" style={{ color: "var(--arcade-accent)" }} />
                  Theme
                </label>
                <span className="text-xs text-[var(--arcade-text-dim)] capitalize">
                  {theme}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id)
                      sound.play("click")
                    }}
                    className={`arcade-btn rounded-lg p-3 flex flex-col items-center gap-2 ${
                      theme === t.id ? "neon-ring" : ""
                    }`}
                  >
                    <span
                      className="h-6 w-10 rounded-full"
                      style={{ background: t.swatch }}
                    />
                    <span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4" style={{ color: "var(--arcade-accent)" }} />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  Volume
                </label>
                <span className="text-xs text-[var(--arcade-text-dim)]">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <Slider
                value={[Math.round(volume * 100)]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setVolume(v[0] / 100)}
                className="[&_[role=slider]]:bg-[var(--arcade-accent)]"
              />
            </div>

            <div className="text-xs text-[var(--arcade-text-dim)] neon-panel rounded-lg p-3">
              <div className="flex justify-between py-0.5">
                <span>Games played</span>
                <span className="text-[var(--arcade-text)] font-semibold">
                  {playedGames.length}/{GAMES.length}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Scores submitted</span>
                <span className="text-[var(--arcade-text)] font-semibold">
                  {scoresSubmitted}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Achievements</span>
                <span className="text-[var(--arcade-text)] font-semibold">
                  {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="neon-panel border-[var(--arcade-border)] text-[var(--arcade-text)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" style={{ color: "var(--arcade-accent)" }} />
              Player Profile
            </DialogTitle>
            <DialogDescription className="text-[var(--arcade-text-dim)]">
              Set your handle and avatar. Your name appears on the leaderboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="text-sm font-medium block mb-2">Handle</label>
              <Input
                value={nameDraft}
                maxLength={18}
                onChange={(e) => setNameDraft(e.target.value)}
                className="arcade-input"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setAvatarDraft(a)
                      sound.play("hover")
                    }}
                    className={`arcade-btn aspect-square rounded-lg text-2xl grid place-items-center ${
                      avatarDraft === a ? "neon-ring" : ""
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProfileOpen(false)} className="arcade-btn">
              Cancel
            </Button>
            <Button onClick={saveProfile} className="bg-[var(--arcade-accent)] text-black hover:opacity-90">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AchievementsSheet open={achOpen} onOpenChange={setAchOpen} />
    </header>
  )
}

function AchievementsSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { unlockedAchievements, playerName } = useGameStore()
  const { scores } = useHighScores(undefined, 20)
  const playerBest = scores
    .filter((s) => s.playerName === playerName)
    .reduce((acc, s) => Math.max(acc, s.score), 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="neon-panel border-[var(--arcade-border)] text-[var(--arcade-text)] w-full sm:max-w-md overflow-y-auto arcade-scroll"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" style={{ color: "var(--arcade-amber)" }} />
            Trophies & Stats
          </SheetTitle>
          <SheetDescription className="text-[var(--arcade-text-dim)]">
            {unlockedAchievements.length} of {ACHIEVEMENTS.length} unlocked.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Best" value={String(playerBest)} />
          <Stat label="Trophies" value={`${unlockedAchievements.length}`} />
          <Stat label="Played" value={`${useGameStore.getState().playedGames.length}`} />
        </div>

        <div className="mt-5 space-y-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchievements.includes(a.id)
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 rounded-lg p-3 border ${
                  unlocked
                    ? "neon-panel border-[var(--arcade-accent)]/40"
                    : "border-[var(--arcade-border)] opacity-55"
                }`}
              >
                <span
                  className="grid place-items-center h-10 w-10 rounded-lg text-xl"
                  style={{
                    background: unlocked
                      ? "rgba(251,191,36,0.12)"
                      : "rgba(255,255,255,0.04)",
                  }}
                >
                  {unlocked ? a.icon : "🔒"}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    {a.title}
                    {a.secret && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--arcade-violet)]/20 text-[var(--arcade-violet)]">
                        SECRET
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--arcade-text-dim)]">
                    {unlocked ? a.description : "Locked — keep playing."}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="neon-panel rounded-lg p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-[var(--arcade-text-dim)]">
        {label}
      </div>
      <div className="text-lg font-black neon-text">{value}</div>
    </div>
  )
}
