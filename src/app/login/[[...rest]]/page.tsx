'use client'

import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">SkillConnectr</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                        The hyper-local micro-skill economy.
                    </p>
                </div>
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: 'w-full',
                            card: 'bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800',
                            headerTitle: 'text-zinc-900 dark:text-zinc-50',
                            headerSubtitle: 'text-zinc-500 dark:text-zinc-400',
                            socialButtonsBlockButton: 'border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                            formButtonPrimary: 'bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200',
                            footerActionLink: 'text-blue-600 hover:text-blue-700',
                            dividerLine: 'bg-zinc-200 dark:bg-zinc-800',
                            dividerText: 'text-zinc-500 dark:text-zinc-400',
                        },
                    }}
                />
            </div>
        </div>
    )
}
