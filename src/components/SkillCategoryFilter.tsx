'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SKILL_CATEGORIES } from '@/lib/skillCategories'

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
