import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MapPin, Calendar, Star, Search, Send, User, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import StartChatButton from '@/components/StartChatButton'
import SkillCategoryFilter from '@/components/SkillCategoryFilter'
import { SKILL_CATEGORIES } from '@/lib/skillCategories'
import { createClient } from '@/utils/supabase/server'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateMatchScore(currentUser: any, candidate: any) {
  const theirGivesMyGets = candidate.gives?.filter((skill: string) => currentUser?.gets?.includes(skill)) || []
  const theirGetsMyGives = candidate.gets?.filter((skill: string) => currentUser?.gives?.includes(skill)) || []
  const skillScore = Math.min((theirGivesMyGets.length + theirGetsMyGives.length) / 2, 1) * 0.5

  let proximityScore = 0
  let distanceKm = null
  if (currentUser?.latitude && currentUser?.longitude && candidate.latitude && candidate.longitude) {
    distanceKm = calculateDistance(currentUser.latitude, currentUser.longitude, candidate.latitude, candidate.longitude)
    proximityScore = Math.max(0, 1 - (distanceKm / 20)) * 0.3
  }

  let availabilityOverlapCount = 0
  const myDays = Object.keys(currentUser?.availability || {})
  myDays.forEach((day: string) => {
    const myTimes = currentUser.availability[day] || []
    const theirTimes = candidate.availability?.[day] || []
    availabilityOverlapCount += myTimes.filter((time: string) => theirTimes.includes(time)).length
  })
  const availabilityScore = Math.min(availabilityOverlapCount / 5, 1) * 0.2

  return {
    score: skillScore + proximityScore + availabilityScore,
    distanceKm,
    theirGivesMyGets,
    theirGetsMyGives,
    availabilityOverlapCount,
  }
}

export default async function MatchFeed({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const { category } = await searchParams

  const supabase = await createClient()

  // Fetch all data in parallel
  const [clerkUser, { data: dbUser }, { data: candidates, error }] = await Promise.all([
    clerkCurrentUser(),
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('profiles').select('*').neq('id', userId)
  ])

  if (dbUser?.is_suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-500" />
          <h1 className="text-2xl font-bold">Account Suspended</h1>
          <p className="text-zinc-500">Your account has been suspended for violating our community guidelines. If you believe this is a mistake, please contact support.</p>
          <div className="pt-4">
            <Link href="/login" className="text-sm font-medium underline">Sign out</Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
     console.error("Error fetching candidates:", error.message, error.code, error.details)
  }

  const scoredCandidates = (candidates || [])
    .map(candidate => ({
      ...candidate,
      matchData: calculateMatchScore(dbUser, candidate),
    }))
    .sort((a, b) => b.matchData.score - a.matchData.score)

  // Filter by category if one is selected
  const selectedCategory = SKILL_CATEGORIES.find(c => c.id === category)
  const filteredCandidates = selectedCategory
    ? scoredCandidates.filter(candidate => {
        const allSkills = [...(candidate.gives || []), ...(candidate.gets || [])]
        return allSkills.some(skill =>
          selectedCategory.keywords.some(kw => skill.toLowerCase().includes(kw))
        )
      })
    : scoredCandidates

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Discovery</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Find the perfect skill exchange partners near you.</p>
        </div>
        <Link
          href="/profile"
          className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-800"
        >
          {clerkUser?.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={clerkUser.imageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-zinc-400" />
          )}
        </Link>
      </div>

      {/* Category Filter */}
      <Suspense>
        <SkillCategoryFilter />
      </Suspense>

      {/* Candidate Cards */}
      <div className="space-y-6 mt-6">
        {filteredCandidates.length === 0 ? (
          <div className="text-center p-12 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 border-dashed">
            <Search className="w-8 h-8 mx-auto text-zinc-400 mb-4" />
            <h3 className="text-lg font-medium">
              {selectedCategory ? `No one in ${selectedCategory.label} yet` : 'No active users yet'}
            </h3>
            <p className="text-zinc-500 mt-2 max-w-xs mx-auto">
              {selectedCategory ? 'Try a different category or clear the filter.' : 'Click Profile to set up your skills!'}
            </p>
          </div>
        ) : (
          filteredCandidates.map(candidate => (
            <div
              key={candidate.id}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-between items-start">

                {/* Left: Profile Info */}
                <div className="space-y-4 flex-1 w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center text-2xl font-bold text-zinc-400 overflow-hidden">
                      {candidate.avatar_url
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={candidate.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        : candidate.name?.charAt(0) || '?'
                      }
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {candidate.name || 'Anonymous User'}
                      </h2>
                      <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                          Match Score: {Math.round(candidate.matchData.score * 100)}%
                        </span>
                        {candidate.matchData.distanceKm !== null && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {candidate.matchData.distanceKm < 1
                              ? '<1km'
                              : `${Math.round(candidate.matchData.distanceKm)}km`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vibes */}
                  {candidate.vibes && candidate.vibes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {candidate.vibes.map((vibe: string) => (
                        <span
                          key={vibe}
                          className="px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {vibe}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Can Give</p>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.gives?.length > 0 ? candidate.gives.map((skill: string) => (
                            <span
                              key={skill}
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                candidate.matchData.theirGetsMyGives.includes(skill)
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                              }`}
                            >
                              {skill}
                            </span>
                          )) : <span className="text-xs text-zinc-400 italic">No skills listed</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Needs Help With</p>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.gets?.length > 0 ? candidate.gets.map((skill: string) => (
                            <span
                              key={skill}
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                candidate.matchData.theirGivesMyGets.includes(skill)
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                              }`}
                            >
                              {skill}
                            </span>
                          )) : <span className="text-xs text-zinc-400 italic">No needs listed</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: CTA */}
                <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[180px]">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Calendar className="w-4 h-4" />
                    {candidate.matchData.availabilityOverlapCount} overlapping slots
                  </div>
                  <Link
                    href={`/request/${candidate.id}`}
                    className="flex w-full items-center justify-center gap-2 px-6 py-4 text-sm font-semibold text-white bg-black hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-2xl transition-all shadow-sm"
                  >
                    Request Session
                    <Send className="w-4 h-4" />
                  </Link>
                  <StartChatButton recipientId={candidate.id} />
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}