import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../lib/api.js', () => ({
    API_BASE: 'https://apis.datos.gob.ar/georef/api',
    fetchJson: vi.fn(),
    getCurrentPosition: vi.fn()
}))

import { fetchJson, getCurrentPosition } from '../lib/api.js'
import { useMunicipality } from '../hooks/useMunicipality.js'

const mockedFetchJson = vi.mocked(fetchJson)
const mockedGetCurrentPosition = vi.mocked(getCurrentPosition)

beforeEach(() => {
    vi.clearAllMocks()
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('useMunicipality', () => {
    it('consulta lat/lon y expone provincia, departamento y municipio', async () => {
        mockedGetCurrentPosition.mockResolvedValue({
            coords: { latitude: -24.19, longitude: -65.3 }
        } as GeolocationPosition)
        mockedFetchJson.mockResolvedValue({
            ubicacion: {
                provincia: { nombre: 'Jujuy' },
                departamento: { nombre: 'Dr. Manuel Belgrano' },
                municipio: { nombre: 'San Salvador de Jujuy' }
            }
        })

        const { result } = renderHook(() => useMunicipality())

        await act(async () => {
            await result.current.fetchMunicipality()
        })

        expect(mockedFetchJson).toHaveBeenCalledWith(
            expect.stringContaining('lat=-24.19&lon=-65.3')
        )
        expect(result.current.municipality).toEqual({
            provincia: 'Jujuy',
            departamento: 'Dr. Manuel Belgrano',
            municipio: 'San Salvador de Jujuy'
        })
    })

    it('expone "Municipio no encontrado" si la API no devuelve ningún nombre', async () => {
        mockedGetCurrentPosition.mockResolvedValue({
            coords: { latitude: 0, longitude: 0 }
        } as GeolocationPosition)
        mockedFetchJson.mockResolvedValue({
            ubicacion: { provincia: {}, departamento: {}, municipio: {} }
        })

        const { result } = renderHook(() => useMunicipality())

        await act(async () => {
            await result.current.fetchMunicipality()
        })

        expect(result.current.error).toBe('Municipio no encontrado')
        expect(result.current.municipality).toBeNull()
    })

    it('expone un mensaje de error y reporta a telemetría si la API falla', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockedGetCurrentPosition.mockResolvedValue({
            coords: { latitude: 0, longitude: 0 }
        } as GeolocationPosition)
        const error = new Error('boom')
        mockedFetchJson.mockRejectedValue(error)

        const { result } = renderHook(() => useMunicipality())

        await act(async () => {
            await result.current.fetchMunicipality()
        })

        expect(result.current.error).toContain('No se pudo consultar la ubicación')
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[telemetry]',
            error,
            expect.objectContaining({ source: 'useMunicipality' })
        )
    })

    it('limpia el municipio previo al reintentar, aunque el reintento falle', async () => {
        mockedGetCurrentPosition.mockResolvedValue({
            coords: { latitude: 0, longitude: 0 }
        } as GeolocationPosition)
        mockedFetchJson
            .mockResolvedValueOnce({
                ubicacion: {
                    provincia: { nombre: 'A' },
                    departamento: { nombre: 'B' },
                    municipio: { nombre: 'C' }
                }
            })
            .mockRejectedValueOnce(new Error('boom'))

        const { result } = renderHook(() => useMunicipality())

        await act(async () => {
            await result.current.fetchMunicipality()
        })
        expect(result.current.municipality).not.toBeNull()

        await act(async () => {
            await result.current.fetchMunicipality()
        })

        expect(result.current.municipality).toBeNull()
        expect(result.current.error).toContain('boom')
    })
})
