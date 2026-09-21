import { useLocale } from '../i18n/localeContext.js'
import { LocaleSwitcher } from './LocaleSwitcher.js'

export function Header() {
    const { messages } = useLocale()

    return (
        <header className="mb-8 border-b border-border pt-6 pb-8 tablet:pt-8 desktop:pt-10">
            <p className="mb-2 font-semibold text-accent">{messages.header.eyebrow}</p>
            <h1 className="text-[clamp(1.9rem,4vw,2.75rem)] tracking-[-0.02em]">
                {messages.header.title}
            </h1>
            <p className="mt-3 max-w-[60ch] text-text-muted">{messages.header.description}</p>
            <LocaleSwitcher />
        </header>
    )
}
