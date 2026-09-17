import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../components/ErrorBoundary.js'

function Bomb(): never {
    throw new Error('boom de prueba')
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
    it('renderiza los hijos normalmente cuando no hay error', () => {
        render(
            <ErrorBoundary>
                <p>contenido normal</p>
            </ErrorBoundary>
        )

        expect(screen.getByText('contenido normal')).toBeInTheDocument()
    })

    it('muestra un mensaje de recuperación y reporta el error si un hijo lanza al renderizar', () => {
        // React también loguea el error de render en consola por su cuenta;
        // se silencia acá para no ensuciar la salida del test.
        vi.spyOn(console, 'error').mockImplementation(() => {})

        render(
            <ErrorBoundary>
                <Bomb />
            </ErrorBoundary>
        )

        expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal')
        expect(console.error).toHaveBeenCalledWith(
            '[telemetry]',
            expect.objectContaining({ message: 'boom de prueba' }),
            expect.objectContaining({ componentStack: expect.any(String) })
        )
    })
})
