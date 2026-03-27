'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getUnreadCount } from '@/app/actions/notifications'
import { useUser } from '@clerk/nextjs'

export default function MessageBadge() {
    const [count, setCount] = useState(0)
    const { user, isLoaded } = useUser()
    const supabase = createClient()

    const fetchCount = useCallback(async () => {
        if (!user) return
        const unread = await getUnreadCount()
        setCount(unread)
    }, [user])

    useEffect(() => {
        if (!isLoaded || !user) return

        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchCount().catch(console.error)

        // Listen for new messages
        const messageChannel = supabase
            .channel('unread_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    fetchCount()
                }
            )
            .subscribe()

        // Listen for new session requests
        const requestChannel = supabase
            .channel('unread_requests')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'session_requests'
                },
                () => {
                    fetchCount()
                }
            )
            .subscribe()

        // Also refresh when messages are marked as read
        const updateChannel = supabase
            .channel('read_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages'
                },
                () => fetchCount()
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'session_requests'
                },
                () => fetchCount()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(messageChannel)
            supabase.removeChannel(requestChannel)
            supabase.removeChannel(updateChannel)
        }
    }, [isLoaded, user, supabase, fetchCount])

    if (count === 0) return null

    return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300">
            {count > 9 ? '9+' : count}
        </span>
    )
}
