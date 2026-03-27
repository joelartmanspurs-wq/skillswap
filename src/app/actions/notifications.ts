'use server'

import { createClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function getUnreadCount() {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) return 0

    // Count unread messages (where recipient is current user)
    // First, find all conversations the user is in
    const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)

    const conversationIds = participations?.map(p => p.conversation_id) || []

    // Count unread messages in those conversations that were NOT sent by the current user
    const { count: unreadMessages, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .eq('is_read', false)

    if (msgError) console.error('Error counting unread messages:', msgError)

    // Count unread session requests (where user is provider)
    const { count: unreadRequests, error: reqError } = await supabase
        .from('session_requests')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', userId)
        .eq('status', 'pending')
        .eq('is_read', false)

    if (reqError) console.error('Error counting unread requests:', reqError)

    return (unreadMessages || 0) + (unreadRequests || 0)
}

export async function markMessagesAsRead(conversationId: string) {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) return

    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)

    if (error) console.error('Error marking messages as read:', error)
}

export async function markRequestsAsRead() {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) return

    const { error } = await supabase
        .from('session_requests')
        .update({ is_read: true })
        .eq('provider_id', userId)
        .eq('status', 'pending')

    if (error) console.error('Error marking requests as read:', error)
}
