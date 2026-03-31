'use client'

import dynamic from 'next/dynamic'

// Load the chatbot only on the client — it uses localStorage and document.body
// which are not available during server-side rendering.
const AIChatBot = dynamic(() => import('./AIChatBot'), { ssr: false })

export default function AIChatBotLoader() {
    return <AIChatBot />
}
