import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neon Arcade — Play 6 Retro Browser Games",
  description:
    "A pocket arcade of glowing, retro-inspired browser games. Play Neon Snake, 2048 Fusion, Memory Matrix, Tic-Tac-Toe AI, Reaction Rush and Whack-a-Mole. Chase high scores and unlock trophies.",
  keywords: [
    "arcade",
    "browser games",
    "snake",
    "2048",
    "memory game",
    "tic tac toe",
    "reaction game",
    "whack a mole",
    "neon",
    "retro games",
  ],
  authors: [{ name: "Neon Arcade" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Neon Arcade",
    description: "Play 6 retro browser games. Chase high scores. Unlock trophies.",
    url: "https://chat.z.ai",
    siteName: "Neon Arcade",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neon Arcade",
    description: "Play 6 retro browser games. Chase high scores. Unlock trophies.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
