'use client'
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs"

export default function AuthButtons() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3 px-2">
        <UserButton />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Account</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <SignInButton mode="modal">
        <button className="w-full px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="w-full px-4 py-2 text-sm font-medium rounded-xl bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
          Sign Up
        </button>
      </SignUpButton>
    </div>
  )
}