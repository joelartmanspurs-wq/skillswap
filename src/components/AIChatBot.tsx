'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AIChatBot() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [streaming, setStreaming] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    const handleSend = async () => {
        if (!input.trim() || streaming) return

        const userMessage: Message = { role: 'user', content: input.trim() }
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setInput('')
        setStreaming(true)

        // Placeholder for the streaming assistant reply
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        abortRef.current = new AbortController()

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages }),
                signal: abortRef.current.signal,
            })

            if (!res.ok || !res.body) throw new Error('Request failed')

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const data = line.slice(6).trim()
                    if (data === '[DONE]') break

                    try {
                        const json = JSON.parse(data)
                        const delta = json.choices?.[0]?.delta?.content
                        if (delta) {
                            setMessages(prev => {
                                const updated = [...prev]
                                updated[updated.length - 1] = {
                                    ...updated[updated.length - 1],
                                    content: updated[updated.length - 1].content + delta,
                                }
                                return updated
                            })
                        }
                    } catch {
                        // skip malformed chunks
                    }
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return
            setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: 'Sorry, something went wrong. Please try again.',
                }
                return updated
            })
        } finally {
            setStreaming(false)
            abortRef.current = null
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3">
            {/* Chat panel */}
            {open && (
                <div className="w-[340px] sm:w-[380px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden"
                    style={{ height: '480px' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-black dark:bg-white flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white dark:text-black" />
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-none">SkillBot</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">Ask me anything</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center pt-6 space-y-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                                    <Bot className="w-6 h-6 text-zinc-400" />
                                </div>
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hi! I&apos;m SkillBot.</p>
                                <p className="text-xs text-zinc-400 max-w-[220px] mx-auto">Ask me how SkillConnectr works, what skills to list, or how to write a great request.</p>
                                <div className="flex flex-col gap-2 mt-4">
                                    {['How does skill swapping work?', 'What skills should I list?', 'Help me write a session request'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => { setInput(q); inputRef.current?.focus() }}
                                            className="text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-left"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-black text-white dark:bg-white dark:text-black'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                }`}>
                                    {msg.content || (
                                        <span className="flex items-center gap-1 text-zinc-400">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Thinking...
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message SkillBot..."
                            disabled={streaming}
                            className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || streaming}
                            className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
                        >
                            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
            >
                {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>
        </div>
    )
}
