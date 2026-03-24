'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

export async function sendMessage(recipientId: string, content: string) {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) throw new Error('Unauthorized')

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

    const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
      conversation_id,
      conversations (
        id,
        updated_at,
        messages (
          content,
          created_at,
          sender_id
        )
      )
    `)
        .eq('user_id', userId)

    if (error) {
        console.error('Error fetching conversations:', error)
        return []
    }

    // Get other participant and last message for each conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversations = await Promise.all(data.map(async (item: any) => {
        const conv = item.conversations

        // Get the other participant
        const { data: otherPart } = await supabase
            .from('conversation_participants')
            .select('user_id, profiles(name, avatar_url)')
            .eq('conversation_id', conv.id)
            .neq('user_id', userId)
            .single()

        // Get last message
        const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        return {
            id: conv.id,
            otherParticipant: otherPart?.profiles,
            otherParticipantId: otherPart?.user_id,
            lastMessage: lastMsg?.content,
            lastMessageAt: lastMsg?.created_at
        }
    }))

    return conversations.sort((a, b) =>
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

    if (!userId) throw new Error('Unauthorized')

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
