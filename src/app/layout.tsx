import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Home, Map as MapIcon, User, Inbox } from 'lucide-react'
import { ClerkProvider } from "@clerk/nextjs"
import AuthButtons from '@/app/components/AuthButtons'
import MessageBadge from '@/components/MessageBadge'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SkillSwap',
  description: 'The hyper-local micro-skill economy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen pb-20 md:pb-0 md:pl-64`}>

          {/* Mobile Top Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 md:hidden">
            <div className="flex justify-between items-center h-16 px-4">
              <h1 className="text-xl font-bold">SkillSwap</h1>
              <AuthButtons />
            </div>
          </header>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-50">
            <div className="flex justify-around items-center h-16">
              <Link href="/" className="flex flex-col items-center p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <Home className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Home</span>
              </Link>
              <Link href="/map" className="flex flex-col items-center p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <MapIcon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Map</span>
              </Link>
              <Link href="/inbox" className="flex flex-col items-center p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors relative">
                <div className="relative">
                  <Inbox className="w-5 h-5 mb-1" />
                  <div className="absolute -top-1 -right-2">
                    <MessageBadge />
                  </div>
                </div>
                <span className="text-[10px] font-medium">Inbox</span>
              </Link>
              <Link href="/profile" className="flex flex-col items-center p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <User className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium">Profile</span>
              </Link>
            </div>
          </nav>

          {/* Desktop Sidebar */}
          <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col p-6 z-50">
            <div className="mb-12">
              <h1 className="text-2xl font-bold tracking-tight">SkillSwap</h1>
            </div>
            <div className="space-y-2 flex-1">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors font-medium">
                <Home className="w-5 h-5" />
                Discovery
              </Link>
              <Link href="/map" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors font-medium">
                <MapIcon className="w-5 h-5" />
                Neighborhood
              </Link>
              <Link href="/inbox" className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors font-medium">
                <div className="flex items-center gap-3">
                  <Inbox className="w-5 h-5" />
                  Requests
                </div>
                <MessageBadge />
              </Link>
              <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors font-medium">
                <User className="w-5 h-5" />
                Profile
              </Link>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <AuthButtons />
            </div>
          </nav>

          <main className="min-h-screen pt-16 md:pt-0">
            {children}
          </main>

        <footer className="max-w-3xl mx-auto p-8 text-center text-zinc-400 text-xs border-t border-zinc-100 dark:border-zinc-800">
           <p>© 2026 SkillSwap. All rights reserved.</p>
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