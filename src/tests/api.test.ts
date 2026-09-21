import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { fetchJson, getCurrentPosition } from '../lib/api.js'

describe('fetchJson', () => {
    let mockFetch: Mock

    beforeEach(() => {
        mockFetch = vi.fn()
        vi.stubGlobal('fetch', mockFetch)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it('devuelve el JSON parseado cuando la respuesta es exitosa', async () => {
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ hello: 'mundo' }) })

        const result = await fetchJson('https://apis.datos.gob.ar/georef/api/provincias')

        expect(result).toEqual({ hello: 'mundo' })
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('reintenta con backoff y finalmente lanza un error si la respuesta nunca es ok', async () => {
        vi.useFakeTimers()
        mockFetch.mockResolvedValue({ ok: false, status: 500 })

        const promise = fetchJson('https://apis.datos.gob.ar/georef/api/provincias')
        const assertion = expect(promise).rejects.toThrow('La API respondió con estado 500')

        await vi.runAllTimersAsync()
        await assertion

        expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('reintenta tras un error de red y resuelve si el siguiente intento funciona', async () => {
        vi.useFakeTimers()
        mockFetch
            .mockRejectedValueOnce(new Error('network error'))
            .mockResolvedValueOnce({ ok: true, json: async () => ({ recuperado: true }) })

        const promise = fetchJson('https://apis.datos.gob.ar/georef/api/provincias')
        await vi.runAllTimersAsync()

        await expect(promise).resolves.toEqual({ recuperado: true })
        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('no reintenta cuando la petición fue cancelada (AbortError)', async () => {
        const abortError = new Error('The user aborted a request.')
        abortError.name = 'AbortError'
        mockFetch.mockRejectedValueOnce(abortError)

        await expect(fetchJson('https://apis.datos.gob.ar/georef/api/provincias')).rejects.toThrow(
            'The user aborted a request.'
        )
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })
})

describe('getCurrentPosition', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('resuelve con la posición que entrega la Geolocation API del navegador', async () => {
        const position = { coords: { latitude: -24.19, longitude: -65.3 } } as GeolocationPosition
        vi.stubGlobal('navigator', {
            geolocation: {
                getCurrentPosition: (success: PositionCallback) => success(position)
            }
        })

        await expect(getCurrentPosition()).resolves.toBe(position)
    })

    it('rechaza con un mensaje claro si el navegador no soporta geolocalización', async () => {
        vi.stubGlobal('navigator', {})

        await expect(getCurrentPosition()).rejects.toThrow(
            'La geolocalización no está disponible en este navegador'
        )
    })

    it('propaga el error que entrega el navegador (ej. permiso denegado)', async () => {
        const deniedError = { code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError
        vi.stubGlobal('navigator', {
            geolocation: {
                getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
                    error(deniedError)
            }
        })

        await expect(getCurrentPosition()).rejects.toBe(deniedError)
    })
})
