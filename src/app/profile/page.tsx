'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from '@/components/ui/TagInput'
import { Loader2, MapPin, CheckCircle2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/utils/supabase/client'
import filter from 'leo-profanity'

// Expand the default profanity list with additional words
filter.add([
  // Hate speech & slurs
  'nigger', 'nigga', 'n1gger', 'n1gga', 'chink', 'gook', 'spic', 'spick', 'kike',
  'wetback', 'beaner', 'raghead', 'towelhead', 'sandnigger', 'cracker', 'honky',
  'faggot', 'fag', 'f4g', 'dyke', 'tranny', 'retard', 'r3tard', 'retarded',
  // Extreme violence / threats
  'killall', 'kill yourself', 'kys', 'go die', 'die bitch', 'murder',
  // Sexual / explicit
  'cock', 'c0ck', 'cocks', 'cocksucker', 'cumshot', 'cumslut', 'cumwhore',
  'dickhead', 'd1ck', 'dildo', 'blowjob', 'handjob', 'fingerbang',
  'pornstar', 'pr0n', 'slut', 'sl00t', 'slutty', 'whore', 'wh0re', 'skank',
  'titties', 't1ts', 'boobies', 'boobjob', 'nudist', 'sexbot',
  // Drug references
  'crackhead', 'crackwhore', 'methhead', 'junkie', 'cokehead',
  // Impersonation / spam
  'admin', 'moderator', 'mod', 'support', 'helpdesk', 'official', 'system',
  'skillswap_admin', 'skillswapmod',
  // Leetspeak / bypass attempts
  'a55', 'a$$', 'biatch', 'b1tch', 'b!tch', 'fuk', 'fvck', 'fück', 'phuck',
  'sh1t', 'sh!t', '$hit', 'dumba$$', 'dumbass', 'jackass', 'jackoff',
  'jerkoff', 'motherfucker', 'mf', 'mtherfkr', 'son of a bitch',
])

const VIBE_OPTIONS = ["Fast-paced", "Patient", "Casual", "Detail-oriented", "Hands-on", "Theoretical", "Intense", "Relaxed"]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIMES = ['Morning', 'Afternoon', 'Evening']

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const [name, setName] = useState('')
  const [gives, setGives] = useState<string[]>([])
  const [gets, setGets] = useState<string[]>([])
  const [givesInput, setGivesInput] = useState('')
  const [getsInput, setGetsInput] = useState('')
  const [vibes, setVibes] = useState<string[]>([])
  const [availability, setAvailability] = useState<Record<string, string[]>>({})
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      if (!isLoaded || !user) return
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (data) {
        setName(data.name || user.fullName || '')
        setGives(data.gives || [])
        setGets(data.gets || [])
        setVibes(data.vibes || [])
        setAvailability(data.availability || {})
        setLatitude(data.latitude)
        setLongitude(data.longitude)
      } else {
        setName(user.fullName || '')
      }
      setLoading(false)
    }
    
    fetchProfile()
  }, [user, isLoaded, supabase])

  const toggleVibe = (vibe: string) => {
    setVibes(prev => prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe])
  }

  const toggleAvailability = (day: string, time: string) => {
    setAvailability(prev => {
      const dayTimes = prev[day] || []
      return { ...prev, [day]: dayTimes.includes(time) ? dayTimes.filter(t => t !== time) : [...dayTimes, time] }
    })
  }

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => { setLatitude(pos.coords.latitude); setLongitude(pos.coords.longitude) },
        () => alert('Could not get your location.')
      )
    }
  }

  const handleSave = async () => {
    if (!user) return

    // 1. Check for profanity in the name
    if (filter.check(name)) {
        alert('Please use a more appropriate display name!')
        return
    }

    setSaving(true)
    
    // Check for any pending text in the tag inputs that wasn't officially added
    const finalGives = givesInput.trim() && !gives.includes(givesInput.trim()) ? [...gives, givesInput.trim()] : gives
    const finalGets = getsInput.trim() && !gets.includes(getsInput.trim()) ? [...gets, getsInput.trim()] : gets
    
    // Clear inputs visually and update tracking arrays
    setGivesInput('')
    setGetsInput('')
    if (finalGives !== gives) setGives(finalGives)
    if (finalGets !== gets) setGets(finalGets)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: name || user.fullName || 'Anonymous',
        avatar_url: user.imageUrl,
        gives: finalGives,
        gets: finalGets,
        vibes,
        availability,
        latitude,
        longitude,
        updated_at: new Date().toISOString()
      })

    setSaving(false)
    if (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile. Make sure you applied the SQL fixes!')
    } else {
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
        router.push('/')
      }, 1500)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-12 pb-24">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Your Profile</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Set up what you give, what you need, and your availability.</p>
        </div>
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-100 dark:border-zinc-800">
          <img src={user?.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Basic Info</h2>
        <div className="grid md:grid-cols-1 gap-8">
            <div className="space-y-2">
                <label className="block text-sm font-medium">Display Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
            </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Value Exchange</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <TagInput label="What can you give? (Skills)" description="Type a skill and press Add or Enter" placeholder="e.g. JavaScript" tags={gives} onChange={setGives} inputValue={givesInput} onInputChange={setGivesInput} />
          <TagInput label="What do you want to get? (Needs)" description="Type a skill you want to learn" placeholder="e.g. Pottery" tags={gets} onChange={setGets} inputValue={getsInput} onInputChange={setGetsInput} />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Personality Style (Vibes)</h2>
        <div className="flex flex-wrap gap-3">
          {VIBE_OPTIONS.map(vibe => (
            <button key={vibe} onClick={() => toggleVibe(vibe)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${vibes.includes(vibe) ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'}`}>
              {vibe}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Weekly Availability</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[500px] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-8 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <div className="p-3 border-r border-zinc-200 dark:border-zinc-800" />
              {DAYS.map(day => <div key={day} className="p-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">{day}</div>)}
            </div>
            {TIMES.map((time, i) => (
              <div key={time} className={`grid grid-cols-8 ${i !== TIMES.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''}`}>
                <div className="p-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800 flex items-center">{time}</div>
                {DAYS.map(day => {
                  const isSelected = (availability[day] || []).includes(time)
                  return (
                    <button key={`${day}-${time}`} onClick={() => toggleAvailability(day, time)} className={`h-12 transition-colors ${isSelected ? 'bg-black/10 dark:bg-white/20' : 'bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-black dark:bg-white mx-auto" />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Proximity</h2>
        <div className="flex items-center gap-4">
          <button onClick={handleGetLocation} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
            <MapPin className="w-4 h-4" />
            {latitude && longitude ? 'Update Location' : 'Get Current Location'}
          </button>
          {latitude && longitude && <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">Location Set</span>}
        </div>
      </section>

      <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
        <button 
            onClick={handleSave} 
            disabled={saving || saveSuccess} 
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all disabled:opacity-50 ${saveSuccess ? 'bg-green-600 text-white' : 'text-white bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200'}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : null}
          {saveSuccess ? 'Saved!' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}