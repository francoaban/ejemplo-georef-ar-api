import { describe, it, expect } from 'vitest'
import { render, screen } from './test-utils.js'
import userEvent from '@testing-library/user-event'
import { LocaleSwitcher } from '../components/LocaleSwitcher.js'
import { useLocale } from '../i18n/localeContext.js'

function LocaleProbe() {
    const { locale } = useLocale()
    return <span data-testid="active-locale">{locale}</span>
}

describe('LocaleSwitcher', () => {
    it('renderiza un botón por idioma con las etiquetas esperadas', () => {
        render(<LocaleSwitcher />)

        expect(screen.getByRole('button', { name: 'Español' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    })

    it('marca con aria-pressed el idioma actualmente activo', () => {
        render(<LocaleSwitcher />, { locale: 'es' })

        expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )
        expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
            'aria-pressed',
            'false'
        )
    })

    it('al hacer clic en "English", cambia el locale activo', async () => {
        const user = userEvent.setup()
        render(
            <>
                <LocaleSwitcher />
                <LocaleProbe />
            </>,
            { locale: 'es' }
        )

        await user.click(screen.getByRole('button', { name: 'English' }))

        expect(screen.getByTestId('active-locale')).toHaveTextContent('en')
        expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute(
            'aria-pressed',
            'true'
        )
        expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute(
            'aria-pressed',
            'false'
        )
    })

    it('el grupo tiene un aria-label accesible bilingüe', () => {
        render(<LocaleSwitcher />)
        expect(screen.getByRole('group', { name: 'Idioma / Language' })).toBeInTheDocument()
    })
})
