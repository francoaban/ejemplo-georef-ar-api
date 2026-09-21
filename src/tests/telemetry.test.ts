import { describe, it, expect, vi, afterEach } from 'vitest'
import { reportError } from '../lib/telemetry.js'

afterEach(() => {
    vi.restoreAllMocks()
})

describe('reportError', () => {
    it('reporta el error a través de console.error con el contexto dado', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const error = new Error('algo falló')

        reportError(error, { cacheKey: 'localidades:38' })

        expect(consoleErrorSpy).toHaveBeenCalledWith('[telemetry]', error, {
            cacheKey: 'localidades:38'
        })
    })

    it('funciona sin contexto explícito', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        reportError('un string, no necesariamente un Error')

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[telemetry]',
            'un string, no necesariamente un Error',
            {}
        )
    })
})
