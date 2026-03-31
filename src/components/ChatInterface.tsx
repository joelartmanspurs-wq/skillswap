'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getMessages } from '@/app/actions/messaging'
import { Send, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
}

export default function ChatInterface({ conversationId, currentUserId, otherPersonName }: {
    conversationId: string
    currentUserId: string
    otherPersonName: string
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    // Keep a ref to the broadcast channel so handleSend can trigger it
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const supabase = useMemo(() => createClient(), [])

    // Stable sync function — fetches latest messages and updates state only on change
    const syncMessages = useCallback(async () => {
        try {
            const data = await getMessages(conversationId) as Message[]
            setMessages(prev => {
                if (prev.length === data.length && prev[prev.length - 1]?.id === data[data.length - 1]?.id) return prev
                return data
            })
        } catch {
            // silently ignore sync errors
        }
    }, [conversationId])

    useEffect(() => {
        // Initial load
        getMessages(conversationId)
            .then(data => setMessages(data as Message[]))
            .catch(err => console.error('Error fetching messages:', err))
            .finally(() => setLoading(false))

        // Layer 1: Supabase Broadcast — works without RLS or postgres_changes publication.
        // When the sender broadcasts after inserting, all subscribers receive it instantly.
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on('broadcast', { event: 'new_message' }, () => {
                syncMessages()
            })
            .subscribe()

        channelRef.current = channel

        // Layer 2: Page visibility + window focus — sync immediately when user returns to tab
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') syncMessages()
        }
        const onFocus = () => syncMessages()

        document.addEventListener('visibilitychange', onVisibilityChange)
        window.addEventListener('focus', onFocus)

        // Layer 3: Polling every 3s — guaranteed fallback if broadcast fails
        const poll = setInterval(syncMessages, 3000)

        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
            clearInterval(poll)
            document.removeEventListener('visibilitychange', onVisibilityChange)
            window.removeEventListener('focus', onFocus)
        }
    }, [conversationId, supabase, syncMessages])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        const content = newMessage
        setNewMessage('')
        setSending(true)

        // Optimistic update
        const tempId = `temp-${Date.now()}`
        setMessages(prev => [...prev, {
            id: tempId,
            content,
            sender_id: currentUserId,
            created_at: new Date().toISOString()
        }])

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
                .select()
                .single()

            if (error) throw error

            // Replace temp with real message
            setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m))

            // Broadcast to other participant — triggers their instant sync
            channelRef.current?.send({
                type: 'broadcast',
                event: 'new_message',
                payload: {}
            })
        } catch (error) {
            console.error('Error sending message:', error)
            setMessages(prev => prev.filter(m => m.id !== tempId))
            setNewMessage(content)
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[500px] bg-zinc-50 dark:bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <h3 className="font-bold">{otherPersonName}</h3>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800'
                                }`}>
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                                    {format(new Date(msg.created_at), 'p')}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none text-sm"
                />
                <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-50 transition-all"
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </form>
        </div>
    )
}
