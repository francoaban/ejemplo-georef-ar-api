import { useLocale, type Locale } from '../i18n/localeContext.js'

const LOCALE_LABELS: Record<Locale, string> = {
    es: 'Español',
    en: 'English'
}

export function LocaleSwitcher() {
    const { locale, setLocale } = useLocale()

    return (
        <fieldset className="mt-4 inline-flex min-w-0 gap-1 rounded-lg border border-border bg-surface p-[0.2rem]">
            <legend className="sr-only">Idioma / Language</legend>
            {(Object.keys(LOCALE_LABELS) as Locale[]).map(code => {
                const pressed = locale === code
                return (
                    <button
                        key={code}
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-[0.85rem] font-semibold transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                            pressed ? 'bg-accent text-white' : 'text-text-muted hover:bg-bg'
                        }`}
                        aria-pressed={pressed}
                        onClick={() => setLocale(code)}
                    >
                        {LOCALE_LABELS[code]}
                    </button>
                )
            })}
        </fieldset>
    )
}
