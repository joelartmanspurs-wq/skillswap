'use client'

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
    tags: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    label?: string
    description?: string
}

export function TagInput({ tags, onChange, placeholder = 'Add a tag...', label, description }: TagInputProps) {
    const [inputValue, setInputValue] = useState('')

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const newTag = inputValue.trim()
            if (newTag && !tags.includes(newTag)) {
                onChange([...tags, newTag])
            }
            setInputValue('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter((tag) => tag !== tagToRemove))
    }

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</label>}
            {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}

            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 rounded-full"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>

            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm"
            />
        </div>
    )
}
