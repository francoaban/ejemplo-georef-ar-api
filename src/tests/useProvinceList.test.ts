import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/api.js', () => ({
    API_BASE: 'https://apis.datos.gob.ar/georef/api',
    fetchJson: vi.fn()
}))

import { fetchJson } from '../lib/api.js'
import { useProvinceList } from '../hooks/useProvinceList.js'

const mockedFetchJson = vi.mocked(fetchJson)

beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
})

describe('useProvinceList', () => {
    it('no consulta la API mientras no se elija una provincia (-1)', () => {
        const { result } = renderHook(() => useProvinceList('localidades'))
        expect(result.current.items).toEqual([])
        expect(mockedFetchJson).not.toHaveBeenCalled()
    })

    it('consulta la API, cachea y ordena el resultado alfabéticamente', async () => {
        mockedFetchJson.mockResolvedValue({
            localidades: [{ nombre: 'Perico' }, { nombre: 'Abra Pampa' }]
        })
        const { result } = renderHook(() => useProvinceList('localidades'))

        act(() => result.current.setProvince('38'))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.items.map(i => i.nombre)).toEqual(['Abra Pampa', 'Perico'])
        expect(sessionStorage.getItem('georef_cache_localidades:38')).not.toBeNull()
    })

    it('usa la caché sin volver a golpear la API en una nueva instancia del hook', async () => {
        sessionStorage.setItem(
            'georef_cache_municipios:38',
            JSON.stringify([{ nombre: 'San Salvador de Jujuy' }])
        )
        const { result } = renderHook(() => useProvinceList('municipios'))

        act(() => result.current.setProvince('38'))

        await waitFor(() => expect(result.current.items.length).toBe(1))
        expect(mockedFetchJson).not.toHaveBeenCalled()
    })

    it('expone un mensaje de error si la API falla', async () => {
        mockedFetchJson.mockRejectedValue(new Error('boom'))
        const { result } = renderHook(() => useProvinceList('localidades'))

        act(() => result.current.setProvince('38'))

        await waitFor(() => expect(result.current.error).toContain('No se pudo cargar el listado'))
        expect(result.current.items).toEqual([])
    })

    it('ignora un AbortError sin setear el mensaje de error', async () => {
        const abortError = new Error('aborted')
        abortError.name = 'AbortError'
        mockedFetchJson.mockRejectedValue(abortError)
        const { result } = renderHook(() => useProvinceList('localidades'))

        act(() => result.current.setProvince('38'))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.error).toBe('')
    })
})
