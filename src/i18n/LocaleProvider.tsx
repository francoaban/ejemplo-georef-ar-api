import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { es } from '../locales/es.js'
import { en } from '../locales/en.js'
import type { MessagesShape } from '../locales/es.js'
import { LocaleContext, type Locale, type LocaleContextValue } from './localeContext.js'

export const LOCALE_STORAGE_KEY = 'mi-ubicacion:locale'

const localeMessages: Record<Locale, MessagesShape> = { es, en }

const documentMeta: Record<Locale, { title: string; description: string }> = {
    es: { title: 'Mi Ubicación', description: es.header.description },
    en: { title: 'My Location', description: en.header.description }
}

function detectInitialLocale(): Locale {
    try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
        if (stored === 'es' || stored === 'en') return stored
    } catch {
        // localStorage puede fallar (modo privado, cuota); se sigue con
        // la detección por navegador en vez de romper el arranque.
    }

    return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

interface LocaleProviderProps {
    children: ReactNode
    initialLocale?: Locale
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? detectInitialLocale())

    function setLocale(next: Locale) {
        setLocaleState(next)
        try {
            localStorage.setItem(LOCALE_STORAGE_KEY, next)
        } catch {
            // Si falla el guardado, el cambio de idioma igual aplica para
            // esta sesión; simplemente no se recuerda la próxima vez.
        }
    }

    useEffect(() => {
        document.documentElement.lang = locale
        document.title = documentMeta[locale].title
        document
            .querySelector('meta[name="description"]')
            ?.setAttribute('content', documentMeta[locale].description)
    }, [locale])

    const value = useMemo<LocaleContextValue>(
        () => ({ locale, setLocale, messages: localeMessages[locale] }),
        [locale]
    )

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
