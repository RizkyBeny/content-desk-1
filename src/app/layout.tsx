import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { Toaster } from "@/components/ui/toaster";
import { AmbientBackground } from "@/components/background/ambient-background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Content Creator Platform",
  description:
    "Platform AI untuk content creator internal — insight, topik, angle, brief, generate & editor dalam satu workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="relative min-h-dvh bg-[color:var(--background)] text-[color:var(--foreground)] antialiased">
        <ThemeScript />
        <ThemeProvider>
          <AmbientBackground />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
