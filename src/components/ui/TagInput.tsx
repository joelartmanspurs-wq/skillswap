'use client'

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
    tags: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    label?: string
    description?: string
    inputValue?: string
    onInputChange?: (value: string) => void
}

export function TagInput({ tags, onChange, placeholder = 'Add a tag...', label, description, inputValue, onInputChange }: TagInputProps) {
    const [localInputValue, setLocalInputValue] = useState('')

    const value = inputValue !== undefined ? inputValue : localInputValue
    const setValue = onInputChange || setLocalInputValue

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const newTag = value.trim()
            if (newTag && !tags.includes(newTag)) {
                onChange([...tags, newTag])
            }
            setValue('')
        }
    }

    const handleAdd = () => {
        const newTag = value.trim()
        if (newTag && !tags.includes(newTag)) {
            onChange([...tags, newTag])
        }
        setValue('')
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

            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="px-4 py-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
                >
                    Add
                </button>
            </div>
        </div>
    )
}
