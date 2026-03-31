'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Code2, Palette, Music, Languages, TrendingUp, Dumbbell, PenLine, FlaskConical, ChefHat, Camera } from 'lucide-react'

export const SKILL_CATEGORIES = [
    {
        id: 'tech',
        label: 'Tech & Code',
        icon: Code2,
        keywords: ['programming', 'coding', 'javascript', 'typescript', 'python', 'react', 'nextjs', 'node', 'web', 'app', 'software', 'data', 'ai', 'machine learning', 'sql', 'database', 'html', 'css', 'backend', 'frontend', 'devops', 'cloud', 'aws', 'docker', 'git', 'api', 'java', 'c++', 'swift', 'kotlin', 'flutter', 'mobile', 'ios', 'android', 'cybersecurity', 'blockchain', 'excel', 'sheets'],
    },
    {
        id: 'design',
        label: 'Design & Art',
        icon: Palette,
        keywords: ['design', 'figma', 'photoshop', 'illustrator', 'ui', 'ux', 'graphic', 'logo', 'branding', 'animation', 'drawing', 'painting', 'illustration', 'art', 'sketch', 'typography', '3d', 'blender', 'after effects', 'premiere', 'video editing', 'motion', 'canva'],
    },
    {
        id: 'music',
        label: 'Music',
        icon: Music,
        keywords: ['guitar', 'piano', 'drums', 'bass', 'singing', 'vocals', 'music', 'production', 'mixing', 'dj', 'violin', 'saxophone', 'trumpet', 'ukulele', 'music theory', 'ableton', 'fl studio', 'recording', 'songwriting', 'composition'],
    },
    {
        id: 'languages',
        label: 'Languages',
        icon: Languages,
        keywords: ['english', 'spanish', 'french', 'german', 'mandarin', 'chinese', 'japanese', 'korean', 'arabic', 'portuguese', 'italian', 'russian', 'hindi', 'language', 'conversation', 'grammar', 'translation', 'linguistics'],
    },
    {
        id: 'business',
        label: 'Business',
        icon: TrendingUp,
        keywords: ['marketing', 'sales', 'business', 'finance', 'accounting', 'entrepreneur', 'startup', 'product', 'management', 'leadership', 'strategy', 'consulting', 'seo', 'social media', 'content', 'copywriting', 'investing', 'trading', 'stocks', 'crypto', 'real estate', 'negotiation'],
    },
    {
        id: 'fitness',
        label: 'Health & Fitness',
        icon: Dumbbell,
        keywords: ['fitness', 'yoga', 'meditation', 'nutrition', 'gym', 'running', 'crossfit', 'pilates', 'boxing', 'martial arts', 'swimming', 'cycling', 'weight training', 'health', 'wellness', 'personal training', 'stretching', 'calisthenics'],
    },
    {
        id: 'writing',
        label: 'Writing',
        icon: PenLine,
        keywords: ['writing', 'blogging', 'poetry', 'fiction', 'creative writing', 'storytelling', 'journalism', 'editing', 'screenwriting', 'copywriting', 'essay', 'proofreading', 'technical writing'],
    },
    {
        id: 'science',
        label: 'Science & Math',
        icon: FlaskConical,
        keywords: ['math', 'mathematics', 'physics', 'chemistry', 'biology', 'statistics', 'calculus', 'algebra', 'science', 'research', 'data science', 'neuroscience', 'psychology', 'economics'],
    },
    {
        id: 'cooking',
        label: 'Cooking & Food',
        icon: ChefHat,
        keywords: ['cooking', 'baking', 'chef', 'food', 'recipes', 'nutrition', 'meal prep', 'pastry', 'cuisine', 'grilling', 'fermentation', 'cocktails', 'coffee', 'barista'],
    },
    {
        id: 'photo',
        label: 'Photo & Video',
        icon: Camera,
        keywords: ['photography', 'photo', 'videography', 'video', 'filming', 'editing', 'lightroom', 'camera', 'cinematography', 'youtube', 'tiktok', 'content creation', 'podcast'],
    },
]

export default function SkillCategoryFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const active = searchParams.get('category')

    const setCategory = (id: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (id) params.set('category', id)
        else params.delete('category')
        router.push(`/?${params.toString()}`)
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
                type="button"
                onClick={() => setCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    !active
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                        : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                }`}
            >
                All
            </button>
            {SKILL_CATEGORIES.map(cat => {
                const Icon = cat.icon
                const isActive = active === cat.id
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(isActive ? null : cat.id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            isActive
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {cat.label}
                    </button>
                )
            })}
        </div>
    )
}
