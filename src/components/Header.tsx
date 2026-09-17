import { messages } from '../lib/messages.js'

export function Header() {
    return (
        <header className="mb-8 border-b border-border pb-8 pt-[clamp(1.5rem,4vw,2.5rem)]">
            <p className="mb-2 font-semibold text-accent">{messages.header.eyebrow}</p>
            <h1 className="text-[clamp(1.9rem,4vw,2.75rem)] tracking-[-0.02em]">{messages.header.title}</h1>
            <p className="mt-3 max-w-[60ch] text-muted">{messages.header.description}</p>
        </header>
    )
}
