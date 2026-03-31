'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

export async function sendMessage(recipientId: string, content: string) {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) throw new Error('AUTH_REQUIRED')

    // Ensure profile exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

    if (!profile) throw new Error('PROFILE_REQUIRED')

    // 1. Find or create a conversation between these two users
    // Find existing conversation
    const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)

    const conversationIds = participants?.map(p => p.conversation_id) || []

    const { data: commonConversation } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('user_id', recipientId)
        .single()

    let conversationId = commonConversation?.conversation_id

    if (!conversationId) {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({})
            .select()
            .single()

        if (convError) throw convError
        conversationId = newConv.id

        // Add participants
        const { error: partError } = await supabase
            .from('conversation_participants')
            .insert([
                { conversation_id: conversationId, user_id: userId },
                { conversation_id: conversationId, user_id: recipientId }
            ])

        if (partError) throw partError
    }

    // 2. Insert the message
    const { error: msgError } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content
        })

    if (msgError) throw msgError

    revalidatePath('/inbox')
    return { conversationId }
}

export async function getConversations() {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) return []

    // Step 1: get conversation IDs for this user
    const { data: myParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)

    if (!myParticipations?.length) return []

    const conversationIds = myParticipations.map(p => p.conversation_id)

    // Step 2: batch-fetch other participants, all messages, and unread messages in parallel
    const [
        { data: otherParticipants },
        { data: allMessages },
        { data: unreadMessages }
    ] = await Promise.all([
        supabase
            .from('conversation_participants')
            .select('conversation_id, user_id, profiles(name, avatar_url)')
            .in('conversation_id', conversationIds)
            .neq('user_id', userId),
        supabase
            .from('messages')
            .select('conversation_id, content, created_at')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false }),
        supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', userId)
            .eq('is_read', false)
    ])

    // Build O(1) lookup maps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const participantMap = new Map<string, any>()
    for (const p of otherParticipants || []) {
        participantMap.set(p.conversation_id, p)
    }

    const lastMessageMap = new Map<string, { content: string; created_at: string }>()
    for (const msg of allMessages || []) {
        if (!lastMessageMap.has(msg.conversation_id)) {
            lastMessageMap.set(msg.conversation_id, msg)
        }
    }

    const unreadCountMap = new Map<string, number>()
    for (const msg of unreadMessages || []) {
        unreadCountMap.set(msg.conversation_id, (unreadCountMap.get(msg.conversation_id) || 0) + 1)
    }

    return conversationIds
        .map(id => {
            const participant = participantMap.get(id)
            const lastMsg = lastMessageMap.get(id)
            return {
                id,
                otherParticipant: participant?.profiles,
                otherParticipantId: participant?.user_id,
                lastMessage: lastMsg?.content,
                lastMessageAt: lastMsg?.created_at,
                unreadCount: unreadCountMap.get(id) || 0
            }
        })
        .sort((a, b) =>
            new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        )
}

export async function getMessages(conversationId: string) {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

    if (error) throw error
    return data
}

export async function startConversation(recipientId: string) {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) throw new Error('AUTH_REQUIRED')

    // Ensure profile exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

    if (!profile) throw new Error('PROFILE_REQUIRED')

    // Find existing conversation
    const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)

    const conversationIds = participants?.map(p => p.conversation_id) || []

    const { data: commonConversation } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('user_id', recipientId)
        .single()

    let conversationId = commonConversation?.conversation_id

    if (!conversationId) {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({})
            .select()
            .single()

        if (convError) throw convError
        conversationId = newConv.id

        // Add participants
        const { error: partError } = await supabase
            .from('conversation_participants')
            .insert([
                { conversation_id: conversationId, user_id: userId },
                { conversation_id: conversationId, user_id: recipientId }
            ])

        if (partError) throw partError
    }

    revalidatePath('/inbox')
    return conversationId
}
