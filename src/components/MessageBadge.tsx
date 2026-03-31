'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUser } from '@clerk/nextjs'

export default function MessageBadge() {
    const [count, setCount] = useState(0)
    const { user, isLoaded } = useUser()
    const supabase = useMemo(() => createClient(), [])

    const fetchCount = useCallback(async () => {
        if (!user) return

        // Get user's conversation IDs
        const { data: participations } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id)

        const conversationIds = participations?.map(p => p.conversation_id) || []

        const [{ count: unreadMessages }, { count: unreadRequests }] = await Promise.all([
            conversationIds.length > 0
                ? supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .in('conversation_id', conversationIds)
                    .neq('sender_id', user.id)
                    .eq('is_read', false)
                : Promise.resolve({ count: 0 }),
            supabase
                .from('session_requests')
                .select('*', { count: 'exact', head: true })
                .eq('provider_id', user.id)
                .eq('status', 'pending')
                .eq('is_read', false)
        ])

        setCount((unreadMessages || 0) + (unreadRequests || 0))
    }, [user, supabase])

    useEffect(() => {
        if (!isLoaded || !user) return

        fetchCount().catch(console.error)

        const channel = supabase
            .channel('badge_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchCount())
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_requests' }, () => fetchCount())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => fetchCount())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_requests' }, () => fetchCount())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isLoaded, user, supabase, fetchCount])

    if (count === 0) return null

    return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-in zoom-in duration-300">
            {count > 9 ? '9+' : count}
        </span>
    )
}
