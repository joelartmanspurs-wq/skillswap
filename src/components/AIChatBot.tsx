'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, GripVertical, Minimize2 } from 'lucide-react'

type DockPos = 'corner-br' | 'corner-bl' | 'corner-tr' | 'corner-tl' | 'panel-right' | 'free'

interface Message { role: 'user' | 'assistant'; content: string }

const SNAP_LABELS: Partial<Record<DockPos, string>> = {
    'panel-right': 'Dock as sidebar',
    'corner-br': 'Bottom right',
    'corner-bl': 'Bottom left',
    'corner-tr': 'Top right',
    'corner-tl': 'Top left',
}

const CORNER_STYLE: Record<string, React.CSSProperties> = {
    'corner-br': { bottom: '6.5rem', right: '1rem' },
    'corner-bl': { bottom: '6.5rem', left: '1rem' },
    'corner-tr': { top: '5rem',     right: '1rem' },
    'corner-tl': { top: '5rem',     left: '1rem' },
}

export default function AIChatBot() {
    const [dock, setDock] = useState<DockPos>(() => {
        if (typeof window === 'undefined') return 'corner-br'
        return (localStorage.getItem('sb-dock') as DockPos) ?? 'corner-br'
    })
    const [open, setOpen]         = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput]       = useState('')
    const [streaming, setStreaming] = useState(false)
    const [panelWidth, setPanelWidth] = useState(() => {
        if (typeof window === 'undefined') return 380
        return parseInt(localStorage.getItem('sb-panel-w') ?? '380')
    })
    const [floatH, setFloatH] = useState(460)
    const [freePos, setFreePos]     = useState({ x: 100, y: 100 })
    const [isDragging, setIsDragging] = useState(false)
    const [ghostPos, setGhostPos]   = useState({ x: 0, y: 0 })
    const [snapPreview, setSnapPreview] = useState<DockPos | null>(null)

    const scrollRef  = useRef<HTMLDivElement>(null)
    const inputRef   = useRef<HTMLInputElement>(null)
    const abortRef   = useRef<AbortController | null>(null)
    const widgetRef  = useRef<HTMLDivElement>(null)

    const isPanel    = dock === 'panel-right'
    const isTopCorner = dock === 'corner-tr' || dock === 'corner-tl'

    // Persist dock position + panel width
    useEffect(() => { localStorage.setItem('sb-dock', dock) }, [dock])
    useEffect(() => { localStorage.setItem('sb-panel-w', panelWidth.toString()) }, [panelWidth])

    // Shift page content when docked as sidebar
    useEffect(() => {
        const body = document.body
        body.style.transition = 'padding-right 240ms cubic-bezier(0.4,0,0.2,1)'
        body.style.paddingRight = isPanel && open ? `${panelWidth}px` : ''
        return () => { body.style.paddingRight = '' }
    }, [isPanel, open, panelWidth])

    // Auto-scroll messages
    useEffect(() => {
        if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages])

    // Focus input on open
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 120)
    }, [open])

    // Detect which snap zone the cursor is in
    const detectZone = useCallback((x: number, y: number): DockPos => {
        const W = window.innerWidth
        const H = window.innerHeight
        const c = 150   // corner radius
        const e = 80    // edge strip for panel

        if (x > W - c && y > H - c) return 'corner-br'
        if (x < c       && y > H - c) return 'corner-bl'
        if (x > W - c && y < c      ) return 'corner-tr'
        if (x < c       && y < c     ) return 'corner-tl'
        if (W >= 768    && x > W - e ) return 'panel-right'
        return 'free'
    }, [])

    // Drag from grip handle
    const handleGripDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        const rect = widgetRef.current?.getBoundingClientRect()
        if (!rect) return
        const ox = e.clientX - rect.left
        const oy = e.clientY - rect.top
        setIsDragging(true)
        setGhostPos({ x: rect.left, y: rect.top })

        const onMove = (ev: MouseEvent) => {
            setGhostPos({ x: ev.clientX - ox, y: ev.clientY - oy })
            setSnapPreview(detectZone(ev.clientX, ev.clientY))
        }
        const onUp = (ev: MouseEvent) => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            const zone = detectZone(ev.clientX, ev.clientY)
            setDock(zone)
            if (zone === 'free') setFreePos({ x: ev.clientX - ox, y: ev.clientY - oy })
            setIsDragging(false)
            setSnapPreview(null)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }, [detectZone])

    // Panel width resize (drag left edge)
    const handlePanelResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        const sx = e.clientX, sw = panelWidth
        const onMove = (ev: MouseEvent) =>
            setPanelWidth(Math.max(280, Math.min(600, sw + (sx - ev.clientX))))
        const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }, [panelWidth])

    // Float height resize (drag top or bottom edge)
    const handleHeightResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        const sy = e.clientY, sh = floatH
        const sign = isTopCorner ? 1 : -1
        const onMove = (ev: MouseEvent) =>
            setFloatH(Math.max(300, Math.min(720, sh + (ev.clientY - sy) * sign)))
        const onUp = () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }, [floatH, isTopCorner])

    // Send message
    const handleSend = async () => {
        if (!input.trim() || streaming) return
        const userMsg: Message = { role: 'user', content: input.trim() }
        const updated = [...messages, userMsg]
        setMessages(updated)
        setInput('')
        setStreaming(true)
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        abortRef.current = new AbortController()
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updated }),
                signal: abortRef.current.signal,
            })
            if (!res.ok || !res.body) throw new Error()
            const reader = res.body.getReader()
            const dec = new TextDecoder()
            let buf = ''
            for (;;) {
                const { done, value } = await reader.read()
                if (done) break
                buf += dec.decode(value, { stream: true })
                const lines = buf.split('\n')
                buf = lines.pop() ?? ''
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const raw = line.slice(6).trim()
                    if (raw === '[DONE]') break
                    try {
                        const delta = JSON.parse(raw).choices?.[0]?.delta?.content
                        if (delta) setMessages(prev => {
                            const c = [...prev]
                            c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + delta }
                            return c
                        })
                    } catch { /* skip malformed chunks */ }
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return
            setMessages(prev => {
                const c = [...prev]
                c[c.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
                return c
            })
        } finally {
            setStreaming(false)
            abortRef.current = null
        }
    }

    // ── Shared sub-components ────────────────────────────────────────────────

    const header = (
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 select-none flex-shrink-0">
            <div className="flex items-center gap-2">
                <div
                    onMouseDown={handleGripDown}
                    title="Drag to move"
                    className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors p-0.5 -ml-1"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
                <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white dark:text-black" />
                </div>
                <span className="text-sm font-bold">SkillBot</span>
            </div>
            <div className="flex items-center gap-0.5">
                {isPanel && (
                    <button
                        type="button"
                        onClick={() => setDock('corner-br')}
                        title="Undock to corner"
                        className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    title="Close chat"
                    className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )

    const emptyState = (
        <div className="text-center pt-4 px-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto">
                <Bot className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="text-xs text-zinc-400 max-w-[220px] mx-auto">Ask how SkillConnectr works, what skills to list, or how to write a great session request.</p>
            <div className="flex flex-col gap-1.5 mt-2">
                {['How does skill swapping work?', 'What skills should I list?', 'Help me write a session request'].map(q => (
                    <button
                        type="button"
                        key={q}
                        onClick={() => { setInput(q); inputRef.current?.focus() }}
                        className="text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-left"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    )

    const messageList = (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? emptyState : messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}>
                        {m.content || (
                            <span className="flex items-center gap-1 text-zinc-400">
                                <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )

    const inputBar = (
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2 flex-shrink-0">
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Message SkillBot..."
                disabled={streaming}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
            />
            <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || streaming}
                title="Send message"
                className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
            >
                {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
        </div>
    )

    // ── Snap zone highlight zones ─────────────────────────────────────────────

    const ZONE_STYLES: Partial<Record<DockPos, React.CSSProperties>> = {
        'panel-right': { right: 0, top: 0, bottom: 0, width: 80 },
        'corner-br':   { right: 0, bottom: 0, width: 150, height: 150 },
        'corner-bl':   { left: 0,  bottom: 0, width: 150, height: 150 },
        'corner-tr':   { right: 0, top: 0,    width: 150, height: 150 },
        'corner-tl':   { left: 0,  top: 0,    width: 150, height: 150 },
    }

    return (
        <>
            {/* ── Snap zone previews ─────────────────────────────────────── */}
            {isDragging && (Object.keys(ZONE_STYLES) as DockPos[]).map(zone => (
                // eslint-disable-next-line react/forbid-dom-props
                <div
                    key={zone}
                    className={`fixed pointer-events-none z-[9998] flex items-center justify-center rounded-2xl transition-all duration-100 ${
                        snapPreview === zone
                            ? 'bg-black/15 dark:bg-white/15 ring-2 ring-inset ring-black/25 dark:ring-white/25'
                            : 'bg-black/4 dark:bg-white/4'
                    }`}
                    style={ZONE_STYLES[zone]}
                >
                    {snapPreview === zone && (
                        <span className="text-[11px] font-semibold bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded-lg shadow-sm">
                            {SNAP_LABELS[zone]}
                        </span>
                    )}
                </div>
            ))}

            {/* ── Drag ghost ─────────────────────────────────────────────── */}
            {isDragging && (
                // eslint-disable-next-line react/forbid-dom-props
                <div
                    className="fixed pointer-events-none z-[9999] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-black/20 dark:border-white/20 opacity-80 overflow-hidden"
                    style={{ left: ghostPos.x, top: ghostPos.y, width: 280 }}
                >
                    <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
                        <GripVertical className="w-4 h-4 text-zinc-400" />
                        <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 text-white dark:text-black" />
                        </div>
                        <span className="text-sm font-bold">SkillBot</span>
                    </div>
                </div>
            )}

            {/* ── Panel mode (docked sidebar) ────────────────────────────── */}
            {isPanel && open && (
                // eslint-disable-next-line react/forbid-dom-props
                <div
                    ref={widgetRef}
                    className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl"
                    style={{ width: panelWidth, transition: 'width 150ms ease' }}
                >
                    {/* Left-edge resize handle */}
                    <div
                        onMouseDown={handlePanelResize}
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                    />
                    {header}
                    {messageList}
                    {inputBar}
                </div>
            )}

            {/* ── Floating mode (corners / free) ────────────────────────── */}
            {!isPanel && (
                // eslint-disable-next-line react/forbid-dom-props
                <div
                    ref={widgetRef}
                    className={`fixed z-50 flex ${isTopCorner ? 'flex-col' : 'flex-col-reverse'} items-end gap-2 transition-[bottom,right,left,top] duration-200 ${isDragging ? 'opacity-25 pointer-events-none' : ''}`}
                    style={dock === 'free' ? { left: freePos.x, top: freePos.y } : CORNER_STYLE[dock]}
                >
                    {/* Chat panel */}
                    {open && (
                        // eslint-disable-next-line react/forbid-dom-props
                        <div
                            className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden"
                            style={{ width: 360, height: floatH }}
                        >
                            {/* Height resize handle */}
                            <div
                                onMouseDown={handleHeightResize}
                                className={`absolute left-6 right-6 h-1.5 rounded-full cursor-row-resize hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors z-10 ${isTopCorner ? 'bottom-1' : 'top-1'}`}
                            />
                            {header}
                            {messageList}
                            {inputBar}
                        </div>
                    )}

                    {/* Toggle button */}
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        title={open ? 'Close SkillBot' : 'Open SkillBot'}
                        className="w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center flex-shrink-0"
                    >
                        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                    </button>
                </div>
            )}

            {/* Re-open button when panel is closed */}
            {isPanel && !open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    title="Open SkillBot"
                    className="fixed bottom-24 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}
        </>
    )
}
