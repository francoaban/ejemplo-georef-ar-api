import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('../lib/api.js', () => ({
    getCurrentPosition: vi.fn()
}))

import { getCurrentPosition } from '../lib/api.js'
import { useGeolocationPermission } from '../hooks/useGeolocationPermission.js'

const mockedGetCurrentPosition = vi.mocked(getCurrentPosition)

beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('navigator', { geolocation: {} })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('useGeolocationPermission', () => {
    it('arranca en estado idle', () => {
        const { result } = renderHook(() => useGeolocationPermission())
        expect(result.current.status).toBe('idle')
    })

    it('pasa a granted cuando el navegador concede el permiso', async () => {
        mockedGetCurrentPosition.mockResolvedValue({ coords: {} } as GeolocationPosition)
        const { result } = renderHook(() => useGeolocationPermission())

        act(() => {
            result.current.requestPermission()
        })

        expect(result.current.status).toBe('requesting')

        await waitFor(() => expect(result.current.status).toBe('granted'))
        expect(result.current.message).toContain('Permiso concedido')
    })

    it('pasa a denied cuando el usuario rechaza el permiso', async () => {
        mockedGetCurrentPosition.mockRejectedValue({
            code: 1,
            PERMISSION_DENIED: 1
        } as GeolocationPositionError)
        const { result } = renderHook(() => useGeolocationPermission())

        await act(async () => {
            await result.current.requestPermission()
        })

        expect(result.current.status).toBe('denied')
        expect(result.current.message).toContain('Permiso denegado')
    })

    it('pasa a unsupported si el navegador no tiene Geolocation API', async () => {
        vi.stubGlobal('navigator', {})
        const { result } = renderHook(() => useGeolocationPermission())

        await act(async () => {
            await result.current.requestPermission()
        })

        expect(result.current.status).toBe('unsupported')
        expect(mockedGetCurrentPosition).not.toHaveBeenCalled()
    })

    it('pasa a error ante fallos que no son de permiso denegado', async () => {
        mockedGetCurrentPosition.mockRejectedValue({
            code: 2
        } as unknown as GeolocationPositionError)
        const { result } = renderHook(() => useGeolocationPermission())

        await act(async () => {
            await result.current.requestPermission()
        })

        expect(result.current.status).toBe('error')
    })
})
