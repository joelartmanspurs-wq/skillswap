import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
    const { messages } = await req.json()

    if (!process.env.GROQ_API_KEY) {
        return new Response('GROQ_API_KEY is not set', { status: 500 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            stream: true,
            messages: [
                {
                    role: 'system',
                    content: `You are a friendly assistant for SkillConnectr, a hyper-local skill-swap platform where neighbours exchange skills with each other (e.g. teaching guitar in exchange for cooking lessons). Help users with things like: discovering how the platform works, writing a good profile bio or skill description, crafting a session request message, deciding what skills to list, and general questions about skill swapping. Keep answers concise and friendly. If asked something unrelated to SkillConnectr or skill swapping, gently steer back to how you can help with the platform.`
                },
                ...messages
            ],
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        return new Response(error, { status: response.status })
    }

    return new Response(response.body, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        },
    })
}
