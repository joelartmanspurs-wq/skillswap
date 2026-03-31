'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, User, Inbox, Settings, Sun, Moon, ChevronUp } from 'lucide-react'
import AuthButtons from '@/app/components/AuthButtons'
import MessageBadge from '@/components/MessageBadge'

export default function SiteNav() {
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'))
    }, [])

    const setTheme = (dark: boolean) => {
        if (dark) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
        setIsDark(dark)
    }

    const navLink = "flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors font-medium"

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-50">
                <div className="flex justify-around items-center h-16">
                    <Link href="/" className="flex flex-col items-center p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                        <Home className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">Home</span>
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
                    <button
                        onClick={() => setTheme(!isDark)}
                        className="flex flex-col items-center p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                        {isDark ? <Sun className="w-5 h-5 mb-1" /> : <Moon className="w-5 h-5 mb-1" />}
                        <span className="text-[10px] font-medium">{isDark ? 'Light' : 'Dark'}</span>
                    </button>
                </div>
            </nav>

            {/* Desktop Sidebar */}
            <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col p-6 z-50">
                <div className="mb-12">
                    <h1 className="text-2xl font-bold tracking-tight">SkillConnectr</h1>
                </div>
                <div className="space-y-2 flex-1">
                    <Link href="/" className={navLink}>
                        <Home className="w-5 h-5" />
                        Discovery
                    </Link>
                    <Link href="/inbox" className={`${navLink} justify-between`}>
                        <div className="flex items-center gap-3">
                            <Inbox className="w-5 h-5" />
                            Requests
                        </div>
                        <MessageBadge />
                    </Link>
                    <Link href="/profile" className={navLink}>
                        <User className="w-5 h-5" />
                        Profile
                    </Link>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-1">
                    {/* Expandable Settings */}
                    <button
                        onClick={() => setSettingsOpen(!settingsOpen)}
                        className={`w-full ${navLink} justify-between`}
                    >
                        <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5" />
                            Settings
                        </div>
                        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${settingsOpen ? '' : 'rotate-180'}`} />
                    </button>

                    {settingsOpen && (
                        <div className="mx-2 mb-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl space-y-2">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">Appearance</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTheme(false)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${!isDark ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                >
                                    <Sun className="w-4 h-4" />
                                    Light
                                </button>
                                <button
                                    onClick={() => setTheme(true)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-zinc-800 shadow-sm text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                >
                                    <Moon className="w-4 h-4" />
                                    Dark
                                </button>
                            </div>
                        </div>
                    )}

                    <AuthButtons />
                </div>
            </nav>
        </>
    )
}
