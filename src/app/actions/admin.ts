'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

async function ensureAdmin(providedPassword?: string) {
    const supabase = await createClient()
    const { userId } = await auth()

    // 1. Check if the provided password is correct (if any)
    if (providedPassword) {
        const { data: config } = await supabase
            .from('admin_config')
            .select('password')
            .eq('id', 1)
            .single()
        
        if (config && config.password === providedPassword) {
            return { supabase, userId }
        }
    }

    // 2. Fallback to checking the user's is_admin flag in their profile
    if (!userId) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

    if (!profile?.is_admin) throw new Error('Forbidden: Admin access required')
    return { supabase, userId }
}

export async function checkAdminPassword(password: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('admin_config')
        .select('password')
        .eq('id', 1)
        .single()
    
    return data?.password === password
}

export async function updateAdminPassword(oldPassword: string, newPassword: string, superAdminPassword: string) {
    const { supabase } = await ensureAdmin(oldPassword)
    
    // Check if the provided super admin password is correct
    if (superAdminPassword !== 'Limbo123!') {
        throw new Error('Invalid Super Admin Password. Access Denied.')
    }
    
    const { error } = await supabase
        .from('admin_config')
        .update({ password: newPassword })
        .eq('id', 1)

    if (error) throw error
    revalidatePath('/admin')
}

export async function getAllUsers(adminPassword?: string) {
    const { supabase } = await ensureAdmin(adminPassword)
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function updateUserName(targetId: string, newName: string, adminPassword?: string) {
    const { supabase } = await ensureAdmin(adminPassword)
    const { error } = await supabase
        .from('profiles')
        .update({ name: newName })
        .eq('id', targetId)

    if (error) throw error
    revalidatePath('/admin')
    revalidatePath('/')
}

export async function toggleUserSuspension(targetId: string, suspend: boolean, adminPassword?: string) {
    const { supabase } = await ensureAdmin(adminPassword)
    const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: suspend })
        .eq('id', targetId)

    if (error) throw error
    revalidatePath('/admin')
}

export async function deleteUserAccount(targetId: string, adminPassword?: string) {
    const { supabase } = await ensureAdmin(adminPassword)
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', targetId)

    if (error) throw error
    revalidatePath('/admin')
    revalidatePath('/')
}
