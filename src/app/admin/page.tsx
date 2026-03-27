'use client'

import { useState } from 'react'
import { getAllUsers, updateUserName, toggleUserSuspension, deleteUserAccount, checkAdminPassword, updateAdminPassword } from '@/app/actions/admin'
import { Loader2, ShieldAlert, Trash2, Ban, UserCheck, Edit2, Check, X, Key, Settings } from 'lucide-react'
import Link from 'next/link'

type Profile = {
    id: string
    name: string
    avatar_url: string | null
    is_admin: boolean
    is_suspended: boolean
    gives: string[]
    created_at: string
}

export default function AdminDashboard() {
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

    // Password change state
    const [showSettings, setShowSettings] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [superAdminPassword, setSuperAdminPassword] = useState('')
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const isValid = await checkAdminPassword(password)
            if (isValid) {
                setIsAuthorized(true)
                await fetchUsers(password)
            } else {
                setError('Incorrect password')
            }
        } catch (err) {
            setError('Error connecting to database')
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async (pwd: string) => {
        setLoading(true)
        try {
            const data = await getAllUsers(pwd)
            setUsers(data as Profile[])
        } catch (_err) {
            setError('Access denied')
            setIsAuthorized(false)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateName = async (userId: string) => {
        if (!editName.trim()) return
        try {
            await updateUserName(userId, editName, password)
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, name: editName } : u))
            setEditingUserId(null)
        } catch (_err) {
            alert('Failed to update name')
        }
    }

    const handleToggleSuspension = async (userId: string, currentStatus: boolean) => {
        const confirmMsg = currentStatus ? 'Unsuspend this user?' : 'Are you sure you want to suspend this user? They will be blocked from the app.'
        if (!confirm(confirmMsg)) return
        
        try {
            await toggleUserSuspension(userId, !currentStatus, password)
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: !currentStatus } : u))
        } catch (_err) {
            alert('Failed to toggle suspension')
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('PERMANENTLY DELETE this user from the database? This cannot be undone.')) return
        
        try {
            await deleteUserAccount(userId, password)
            setUsers(prev => prev.filter(u => u.id !== userId))
        } catch (_err) {
            alert('Failed to delete user')
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match')
            return
        }
        if (newPassword.length < 4) {
             alert('Password too short')
             return
        }

        setPasswordChangeLoading(true)
        try {
            await updateAdminPassword(password, newPassword, superAdminPassword)
            setPassword(newPassword)
            setNewPassword('')
            setConfirmNewPassword('')
            setSuperAdminPassword('')
            setShowSettings(false)
            alert('Admin password updated successfully!')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update password. Session may have expired.'
            alert(errorMessage)
        } finally {
            setPasswordChangeLoading(false)
        }
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center">
                            <ShieldAlert className="w-8 h-8 text-white dark:text-black" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center mb-2">Admin Access</h1>
                    <p className="text-center text-zinc-500 text-sm mb-8">Enter the master password to manage users.</p>
                    
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Master Password"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-center text-lg tracking-widest"
                            autoFocus
                            disabled={loading}
                        />
                        {error && <p className="text-red-500 text-center text-sm font-medium">{error}</p>}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                            Enter Dashboard
                        </button>
                        <Link href="/" className="block text-center text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 pt-2">
                            Return to App
                        </Link>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 pb-32">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Moderation</h1>
                    <p className="text-zinc-500 mt-2">Manage the community, fix names, and suspend accounts.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowSettings(!showSettings)} 
                        className={`p-2 rounded-xl border transition-all ${showSettings ? 'bg-black text-white dark:bg-white dark:text-black' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 border-zinc-200'}`}
                        title="Admin Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <div className="h-10 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2" />
                    <span className="text-xs font-mono text-zinc-400">{users.length} Active Profiles</span>
                    <button onClick={() => fetchUsers(password)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {showSettings && (
                <div className="bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Security Settings
                    </h2>
                    <form onSubmit={handleChangePassword} className="grid md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 text-red-500">Super Admin Pass</label>
                            <input 
                                type="password" 
                                value={superAdminPassword}
                                onChange={(e) => setSuperAdminPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Required to change"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">New Admin Password</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                placeholder="Min 4 characters"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500">Confirm New Password</label>
                            <input 
                                type="password" 
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                placeholder="Repeat password"
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={passwordChangeLoading}
                            className="bg-black text-white dark:bg-white dark:text-black py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {passwordChangeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Update Master Password
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500">User</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Skills (Gives)</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Joined</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                                {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400">{user.name?.[0]}</div>}
                                            </div>
                                            <div>
                                                {editingUserId === user.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="px-2 py-1 text-sm bg-transparent border border-zinc-300 rounded focus:border-black outline-none"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleUpdateName(user.id)} className="text-green-500"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => setEditingUserId(null)} className="text-red-500"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">{user.name}</span>
                                                        <button onClick={() => { setEditingUserId(user.id); setEditName(user.name) }} className="text-zinc-300 hover:text-zinc-600"><Edit2 className="w-3 h-3" /></button>
                                                    </div>
                                                )}
                                                <p className="text-[10px] font-mono text-zinc-400">{user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {user.is_suspended ? (
                                            <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-red-100 text-red-600 uppercase">Suspended</span>
                                        ) : (
                                            <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-600 uppercase">Active</span>
                                        )}
                                        {user.is_admin && <span className="ml-2 px-2 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-600 uppercase">Admin</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.gives?.slice(0, 2).map((s: string) => (
                                                <span key={s} className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800">{s}</span>
                                            ))}
                                            {user.gives?.length > 2 && <span className="text-[10px] text-zinc-400">+{user.gives.length - 2}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-zinc-500 font-mono">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleToggleSuspension(user.id, user.is_suspended)}
                                                title={user.is_suspended ? 'Unsuspend' : 'Suspend'}
                                                className={`p-2 rounded-xl border transition-all ${user.is_suspended ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50'}`}
                                            >
                                                {user.is_suspended ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                title="Delete Account"
                                                className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] text-zinc-500 font-mono text-center">
                SKILLSWAP_ADMIN_PROTOCOL_V2 // RUNNING STABLE // SESSION PERSISTENT: FALSE
            </div>
        </div>
    )
}
