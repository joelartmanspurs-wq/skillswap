'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Loader2 } from 'lucide-react'
import { startConversation } from '@/app/actions/messaging'

export default function StartChatButton({ recipientId }: { recipientId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleStartChat = async () => {
        setLoading(true)
        try {
            await startConversation(recipientId)
            router.push('/inbox')
        } catch (error) {
            console.error('Error starting chat:', error)
            alert('Could not start chat. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleStartChat}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 px-6 py-4 text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-2xl transition-all shadow-sm"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Message
        </button>
    )
}
