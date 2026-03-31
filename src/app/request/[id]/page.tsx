'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { sendMessage } from '@/app/actions/messaging'
import { useUser } from '@clerk/nextjs'
import { createSessionRequest } from '@/app/actions/sessions'

export default function RequestSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: recipientId } = use(params)
  const { user, isLoaded } = useUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [candidate, setCandidate] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const [skillRequested, setSkillRequested] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchCandidate = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', recipientId)
        .single()
      if (data) {
        setCandidate(data)
        setSkillRequested(data.gives?.[0] || '')
      }
    }
    fetchCandidate()
  }, [recipientId, supabase])

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !user) {
      alert('You need to create an account before you can message other users or send session requests. Sign up or log in to continue.')
      router.push('/login')
      return
    }
    setSending(true)

    try {
      // 1. Create the session request using server action
      await createSessionRequest(recipientId, skillRequested, dateStr || undefined)

      // 2. If message provided, send it
      if (message.trim()) {
        await sendMessage(recipientId, message)
      }

      router.push('/inbox')
    } catch (error) {
      console.error('Error sending request:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage === 'AUTH_REQUIRED' || errorMessage === 'PROFILE_REQUIRED' || errorMessage.includes('not authenticated')) {
        alert('You need to create an account before you can message other users or send session requests. Sign up or log in to continue.')
        router.push('/login')
      } else {
        alert('Something went wrong sending your request. Please try again.')
      }
    } finally {
      setSending(false)
    }
  }

  if (!candidate) return <div className="p-12 text-center text-zinc-500">Loading profile...</div>

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 pb-24 space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-black dark:hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Discovery
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Request a Session</h1>
        <p className="text-zinc-500 mt-2">Send a skill swap request to {candidate.name}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
        <form onSubmit={handleSendRequest} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">What skill do you want to learn?</label>
            <select value={skillRequested} onChange={e => setSkillRequested(e.target.value)} className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" required>
              <option value="" disabled>Select a skill</option>
              {candidate.gives?.map((skill: string) => <option key={skill} value={skill}>{skill}</option>)}
              <option value="other">Other / Not Listed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Proposed Time (Optional)</label>
            <input type="datetime-local" value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message (Optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi! I'd love to learn..." rows={4} className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none" />
          </div>
          <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold text-white bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-xl transition-all disabled:opacity-50">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Send Request
          </button>
        </form>
      </div>
    </div>
  )
}