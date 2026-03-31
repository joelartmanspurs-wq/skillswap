import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { ClerkProvider } from "@clerk/nextjs"
import AuthButtons from '@/app/components/AuthButtons'
import SiteNav from '@/components/SiteNav'
import AIChatBot from '@/components/AIChatBot'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SkillConnectr',
  description: 'The hyper-local micro-skill economy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Prevent flash of wrong theme on load */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              var saved = localStorage.getItem('theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (saved === 'dark' || (!saved && prefersDark)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `}} />
        </head>
        <body className={`${inter.className} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen pb-20 md:pb-0 md:pl-64`}>

          {/* Mobile Top Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 md:hidden">
            <div className="flex justify-between items-center h-16 px-4">
              <h1 className="text-xl font-bold">SkillConnectr</h1>
              <AuthButtons />
            </div>
          </header>

          <SiteNav />

          <main className="min-h-screen pt-16 md:pt-0">
            {children}
          </main>

          <AIChatBot />

          <footer className="max-w-3xl mx-auto p-8 text-center text-zinc-400 text-xs border-t border-zinc-100 dark:border-zinc-800">
            <p>© 2026 SkillConnectr. All rights reserved.</p>
            <div className="mt-4 flex justify-center gap-6">
              <Link href="/admin" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Admin Access</Link>
              <span>•</span>
              <Link href="/profile" className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Settings</Link>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
