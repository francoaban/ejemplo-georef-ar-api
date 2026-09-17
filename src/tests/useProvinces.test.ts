import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/api.js', () => ({
    API_BASE: 'https://apis.datos.gob.ar/georef/api',
    fetchJson: vi.fn()
}))

import { fetchJson } from '../lib/api.js'
import { useProvinces } from '../hooks/useProvinces.js'

const mockedFetchJson = vi.mocked(fetchJson)

beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
})

describe('useProvinces', () => {
    it('no consulta la API mientras enabled sea false', () => {
        renderHook(() => useProvinces(false))
        expect(mockedFetchJson).not.toHaveBeenCalled()
    })

    it('consulta, cachea y ordena alfabéticamente cuando enabled pasa a true', async () => {
        mockedFetchJson.mockResolvedValue({
            provincias: [
                { id: '14', nombre: 'Córdoba' },
                { id: '1', nombre: 'Buenos Aires' }
            ]
        })

        const { result } = renderHook(() => useProvinces(true))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.provinces.map(p => p.nombre)).toEqual(['Buenos Aires', 'Córdoba'])
        expect(sessionStorage.getItem('georef_cache_provinces')).not.toBeNull()
    })

    it('usa la caché sin volver a golpear la API', async () => {
        sessionStorage.setItem(
            'georef_cache_provinces',
            JSON.stringify([{ id: '38', nombre: 'Jujuy' }])
        )

        const { result } = renderHook(() => useProvinces(true))

        await waitFor(() => expect(result.current.provinces.length).toBe(1))
        expect(mockedFetchJson).not.toHaveBeenCalled()
    })

    it('expone un error si la respuesta de la API tiene un formato inesperado', async () => {
        mockedFetchJson.mockResolvedValue({ algoQueNoEsProvincias: true })

        const { result } = renderHook(() => useProvinces(true))

        await waitFor(() =>
            expect(result.current.error).toContain('No se pudieron cargar las provincias')
        )
        expect(result.current.provinces).toEqual([])
    })

    it('expone un error si la API falla', async () => {
        mockedFetchJson.mockRejectedValue(new Error('caída'))

        const { result } = renderHook(() => useProvinces(true))

        await waitFor(() => expect(result.current.error).toContain('caída'))
    })
})
