import { createContext, useContext } from 'react'
import type { MessagesShape } from '../locales/es.js'

export type Locale = 'es' | 'en'

export interface LocaleContextValue {
    locale: Locale
    setLocale: (locale: Locale) => void
    messages: MessagesShape
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
    const context = useContext(LocaleContext)
    if (!context) {
        throw new Error('useLocale debe usarse dentro de un <LocaleProvider>')
    }
    return context
}
