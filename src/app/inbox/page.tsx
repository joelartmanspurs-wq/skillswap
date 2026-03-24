'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Check, X, Video, MessageSquare, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { getConversations } from '@/app/actions/messaging'
import { updateSessionRequestStatus } from '@/app/actions/sessions'
import ChatInterface from '@/components/ChatInterface'
import { useUser } from '@clerk/nextjs'

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'messages'>('requests')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requests, setRequests] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conversations, setConversations] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user, isLoaded } = useUser()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!user) return

    // Fetch Session Requests
    const { data: reqs } = await supabase
      .from('session_requests')
      .select('*, learner:profiles!learner_id(name), provider:profiles!provider_id(name)')
      .or(`learner_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (reqs) setRequests(reqs)

    // Fetch Conversations
    const convs = await getConversations()
    setConversations(convs)

    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    if (isLoaded && user) {
      fetchData()

      // Real-time subscription for session requests
      const channel = supabase
        .channel('session_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*', 
            schema: 'public',
            table: 'session_requests'
          },
          () => {
            // Refresh data when any change occurs in session_requests
            fetchData()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isLoaded, user, fetchData, supabase])

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await updateSessionRequestStatus(id, status)
      // Local state will be updated by the realtime listener or manually here for speed
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch (error) {
       console.error("Error updating status:", error)
       alert("Failed to update status")
    }
  }

  if (!isLoaded || loading) return <div className="p-12 text-center text-zinc-500">Loading your inbox...</div>

  const userId = user?.id
  const pendingIncoming = requests.filter(r => r.provider_id === userId && r.status === 'pending')
  const others = requests.filter(r => !(r.provider_id === userId && r.status === 'pending'))

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-zinc-500 mt-2">Manage your skill swap requests and messages.</p>
        </div>
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Requests
            </div>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'messages' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'requests' ? (
        <div className="space-y-8 transition-all">
          {pendingIncoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 italic flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Action Required
              </h2>
              {pendingIncoming.map(req => (
                <div key={req.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg"><span className="text-zinc-500 font-normal">Request from</span> {req.learner?.name || 'New User'}</h3>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Wants to learn: <span className="font-medium px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">{req.skill_requested}</span>
                      </p>
                      {req.proposed_time && (
                        <p className="text-sm mt-3 text-zinc-500">Proposed Time: {format(new Date(req.proposed_time), 'PPp')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus(req.id, 'accepted')} className="w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">All Sessions</h2>
            {others.length === 0 && pendingIncoming.length === 0 ? (
              <div className="text-center p-12 border border-zinc-200 border-dashed dark:border-zinc-800 rounded-3xl">
                <p className="text-zinc-500">No requests yet. Head to Discovery to find a match!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {others.map(req => {
                  const isProvider = req.provider_id === userId
                  const otherPerson = isProvider ? req.learner : req.provider
                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }
                  return (
                    <div key={req.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[req.status] || 'bg-zinc-100 text-zinc-700'}`}>{req.status}</span>
                          <span className="text-sm text-zinc-500">{format(new Date(req.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="mt-2 text-zinc-900 dark:text-zinc-100">
                          {isProvider
                            ? <span>You are teaching <span className="font-semibold">{otherPerson?.name || 'Anonymous'}</span></span>
                            : <span>You asked to learn from <span className="font-semibold">{otherPerson?.name || 'Anonymous'}</span></span>
                          }
                          <span className="mx-2 text-zinc-300">•</span>
                          <span className="font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-sm">{req.skill_requested}</span>
                        </div>
                      </div>
                      {req.status === 'accepted' && req.meet_link && (
                        <a href={req.meet_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors">
                          <Video className="w-4 h-4" />
                          Join Meet
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px] transition-all">
          <div className="md:col-span-1 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 flex flex-col shadow-sm">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <h3 className="font-bold text-sm">Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-8 text-center text-sm text-zinc-500">No messages yet.</p>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 flex flex-col items-start gap-1 border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${selectedConversation?.id === conv.id ? 'bg-zinc-50 dark:bg-zinc-800 pr-2 border-r-4 border-r-black dark:border-r-white' : ''}`}
                  >
                    <div className="flex justify-between w-full items-baseline">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{conv.otherParticipant?.name}</span>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-zinc-400">{format(new Date(conv.lastMessageAt), 'MMM d')}</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate w-full text-left">{conv.lastMessage || 'No messages yet'}</p>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            {selectedConversation ? (
              <ChatInterface
                conversationId={selectedConversation.id}
                currentUserId={userId!}
                otherPersonName={selectedConversation.otherParticipant?.name}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-950/50">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="font-bold text-lg">Your Messages</h3>
                <p className="text-zinc-500 text-sm mt-2 max-w-[240px]">Select a conversation from the left to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}