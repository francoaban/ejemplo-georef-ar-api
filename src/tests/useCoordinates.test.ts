import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/api.js', () => ({
    getCurrentPosition: vi.fn()
}))

import { getCurrentPosition } from '../lib/api.js'
import { useCoordinates } from '../hooks/useCoordinates.js'

const mockedGetCurrentPosition = vi.mocked(getCurrentPosition)

beforeEach(() => {
    vi.clearAllMocks()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('useCoordinates', () => {
    it('arranca sin coordenadas y sin error', () => {
        const { result } = renderHook(() => useCoordinates())
        expect(result.current.coordinates).toBeNull()
        expect(result.current.error).toBe('')
    })

    it('expone latitud y longitud tras una consulta exitosa', async () => {
        mockedGetCurrentPosition.mockResolvedValue({
            coords: { latitude: -24.19, longitude: -65.3 }
        } as GeolocationPosition)
        const { result } = renderHook(() => useCoordinates())

        await act(async () => {
            await result.current.fetchCoordinates()
        })

        expect(result.current.coordinates).toEqual({ latitude: -24.19, longitude: -65.3 })
        expect(result.current.error).toBe('')
    })

    it('expone un mensaje de error y reporta a telemetría si falla la geolocalización', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const error = new Error('denegado')
        mockedGetCurrentPosition.mockRejectedValue(error)
        const { result } = renderHook(() => useCoordinates())

        await act(async () => {
            await result.current.fetchCoordinates()
        })

        expect(result.current.error).toContain('No se pudo obtener la ubicación')
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[telemetry]',
            error,
            expect.objectContaining({ source: 'useCoordinates' })
        )
    })

    it('limpia las coordenadas previas al reintentar, aunque el reintento falle', async () => {
        mockedGetCurrentPosition
            .mockResolvedValueOnce({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition)
            .mockRejectedValueOnce(new Error('timeout'))

        const { result } = renderHook(() => useCoordinates())

        await act(async () => {
            await result.current.fetchCoordinates()
        })
        expect(result.current.coordinates).not.toBeNull()

        await act(async () => {
            await result.current.fetchCoordinates()
        })

        expect(result.current.coordinates).toBeNull()
        expect(result.current.error).toContain('timeout')
    })

    it('marca loading mientras espera la respuesta', async () => {
        let resolvePosition: (position: GeolocationPosition) => void
        mockedGetCurrentPosition.mockReturnValue(
            new Promise(resolve => {
                resolvePosition = resolve
            })
        )
        const { result } = renderHook(() => useCoordinates())

        act(() => {
            result.current.fetchCoordinates()
        })
        expect(result.current.loading).toBe(true)

        await act(async () => {
            resolvePosition({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition)
        })

        await waitFor(() => expect(result.current.loading).toBe(false))
    })
})
