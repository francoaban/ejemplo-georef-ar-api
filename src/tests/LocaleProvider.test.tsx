import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render as renderRTL, screen as screenRTL } from '@testing-library/react'
import { render, screen, waitFor } from './test-utils.js'
import userEvent from '@testing-library/user-event'
import { renderHook } from '@testing-library/react'
import { LocaleProvider, LOCALE_STORAGE_KEY } from '../i18n/LocaleProvider.js'
import { useLocale } from '../i18n/localeContext.js'
import { es } from '../locales/es.js'
import { en } from '../locales/en.js'

function TestConsumer() {
    const { locale, messages, setLocale } = useLocale()
    return (
        <div>
            <span data-testid="locale">{locale}</span>
            <span data-testid="title">{messages.header.title}</span>
            <button onClick={() => setLocale('en')}>a inglés</button>
            <button onClick={() => setLocale('es')}>a español</button>
        </div>
    )
}

function attachDescriptionMeta() {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
    return meta
}

beforeEach(() => {
    localStorage.clear()
    document.title = ''
    document.head.querySelectorAll('meta[name="description"]').forEach(el => el.remove())
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('useLocale', () => {
    it('lanza un error explícito si se usa fuera de <LocaleProvider>', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => renderHook(() => useLocale())).toThrow(
            'useLocale debe usarse dentro de un <LocaleProvider>'
        )
        consoleErrorSpy.mockRestore()
    })
})

describe('LocaleProvider — detección del locale inicial (sin forzar initialLocale)', () => {
    it('cae en español si navigator.language no empieza con "en"', () => {
        vi.stubGlobal('navigator', { language: 'fr-FR' })
        renderRTL(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>
        )
        expect(screenRTL.getByTestId('locale')).toHaveTextContent('es')
    })

    it('detecta inglés si navigator.language empieza con "en" (ej. "en-US")', () => {
        vi.stubGlobal('navigator', { language: 'en-US' })
        renderRTL(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>
        )
        expect(screenRTL.getByTestId('locale')).toHaveTextContent('en')
    })

    it('una preferencia guardada en localStorage tiene prioridad sobre navigator.language', () => {
        localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
        vi.stubGlobal('navigator', { language: 'fr-FR' }) // ninguno de los dos "ganaría" por su cuenta
        renderRTL(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>
        )
        expect(screenRTL.getByTestId('locale')).toHaveTextContent('en')
    })

    it('ignora un valor corrupto en localStorage y cae en la detección por navegador', () => {
        localStorage.setItem(LOCALE_STORAGE_KEY, 'fr') // valor inválido: no es 'es' ni 'en'
        vi.stubGlobal('navigator', { language: 'en-GB' })
        renderRTL(
            <LocaleProvider>
                <TestConsumer />
            </LocaleProvider>
        )
        expect(screenRTL.getByTestId('locale')).toHaveTextContent('en')
    })
})

describe('LocaleProvider — cambio de locale', () => {
    it('setLocale actualiza el contexto y los mensajes visibles', async () => {
        const user = userEvent.setup()
        render(<TestConsumer />)

        expect(screen.getByTestId('title')).toHaveTextContent(es.header.title)

        await user.click(screen.getByText('a inglés'))

        expect(screen.getByTestId('locale')).toHaveTextContent('en')
        expect(screen.getByTestId('title')).toHaveTextContent(en.header.title)
    })

    it('persiste la elección en localStorage', async () => {
        const user = userEvent.setup()
        render(<TestConsumer />)

        await user.click(screen.getByText('a inglés'))

        expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
    })

    it('no rompe si localStorage.setItem falla (modo privado, cuota excedida)', async () => {
        const user = userEvent.setup()
        const originalSetItem = Storage.prototype.setItem
        Storage.prototype.setItem = () => {
            throw new Error('QuotaExceededError')
        }

        render(<TestConsumer />)
        await user.click(screen.getByText('a inglés'))

        expect(screen.getByTestId('locale')).toHaveTextContent('en')

        Storage.prototype.setItem = originalSetItem
    })
})

describe('LocaleProvider — sincronización de document.title / meta / lang', () => {
    it('actualiza document.title y el lang del <html> según el locale activo', async () => {
        const user = userEvent.setup()
        render(<TestConsumer />)

        await waitFor(() => expect(document.title).toBe('Mi Ubicación'))
        expect(document.documentElement.lang).toBe('es')

        await user.click(screen.getByText('a inglés'))

        await waitFor(() => expect(document.title).toBe('My Location'))
        expect(document.documentElement.lang).toBe('en')
    })

    it('actualiza el contenido de <meta name="description"> si existe en el documento', async () => {
        const meta = attachDescriptionMeta()
        const user = userEvent.setup()
        render(<TestConsumer />)

        await waitFor(() => expect(meta.getAttribute('content')).toBe(es.header.description))

        await user.click(screen.getByText('a inglés'))

        await waitFor(() => expect(meta.getAttribute('content')).toBe(en.header.description))
    })

    it('no rompe si no existe <meta name="description"> en el documento', () => {
        expect(() => render(<TestConsumer />)).not.toThrow()
    })
})
