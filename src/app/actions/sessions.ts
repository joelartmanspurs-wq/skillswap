'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

export async function createSessionRequest(providerId: string, skillRequested: string, proposedTime?: string) {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('session_requests')
        .insert({
            provider_id: providerId,
            learner_id: userId,
            skill_requested: skillRequested,
            proposed_time: proposedTime || null,
            status: 'pending'
        })
        .select()
        .single()

    if (error) throw error
    
    revalidatePath('/inbox')
    return data
}

export async function updateSessionRequestStatus(requestId: string, status: 'accepted' | 'rejected') {
    const supabase = await createClient()
    const { userId } = await auth()

    if (!userId) throw new Error('Unauthorized')

    // Optional: Add check to ensure the user is the provider
    const { error } = await supabase
        .from('session_requests')
        .update({ status })
        .eq('id', requestId)
        .eq('provider_id', userId) // Security: Only the provider can accept/reject

    if (error) throw error

    revalidatePath('/inbox')
    return { success: true }
}
