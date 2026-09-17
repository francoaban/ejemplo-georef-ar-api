import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCachedResource } from '../hooks/useCachedResource.js'

beforeEach(() => {
    sessionStorage.clear()
})

describe('useCachedResource', () => {
    it('no dispara el fetcher cuando cacheKey es null', () => {
        const fetcher = vi.fn()
        const { result } = renderHook(() => useCachedResource({ cacheKey: null, fetcher }))

        expect(fetcher).not.toHaveBeenCalled()
        expect(result.current.data).toBeNull()
        expect(result.current.loading).toBe(false)
    })

    it('no dispara el fetcher cuando enabled es false', () => {
        const fetcher = vi.fn()
        renderHook(() => useCachedResource({ cacheKey: 'x', enabled: false, fetcher }))
        expect(fetcher).not.toHaveBeenCalled()
    })

    it('usa el dato cacheado sin llamar al fetcher', async () => {
        sessionStorage.setItem('georef_cache_mi-key', JSON.stringify({ ok: true }))
        const fetcher = vi.fn()

        const { result } = renderHook(() => useCachedResource({ cacheKey: 'mi-key', fetcher }))

        expect(result.current.data).toEqual({ ok: true })
        expect(fetcher).not.toHaveBeenCalled()
    })

    it('llama al fetcher, cachea el resultado y expone loading correctamente', async () => {
        let resolveFetch: (value: { valor: number }) => void = () => {}
        const fetcher = vi.fn(
            () =>
                new Promise<{ valor: number }>(resolve => {
                    resolveFetch = resolve
                })
        )

        const { result } = renderHook(() => useCachedResource({ cacheKey: 'nueva-key', fetcher }))

        expect(result.current.loading).toBe(true)

        resolveFetch({ valor: 42 })
        await waitFor(() => expect(result.current.loading).toBe(false))

        expect(result.current.data).toEqual({ valor: 42 })
        expect(sessionStorage.getItem('georef_cache_nueva-key')).toBe(JSON.stringify({ valor: 42 }))
    })

    it('expone el error del fetcher, reporta a telemetría y deja loading en false', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const error = new Error('falló')
        const fetcher = vi.fn().mockRejectedValue(error)
        const { result } = renderHook(() => useCachedResource({ cacheKey: 'err-key', fetcher }))

        await waitFor(() => expect(result.current.error).toBe('falló'))
        expect(result.current.loading).toBe(false)
        expect(result.current.data).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[telemetry]',
            error,
            expect.objectContaining({ cacheKey: 'err-key' })
        )
        consoleErrorSpy.mockRestore()
    })

    it('ante un AbortError, no setea error y loading vuelve a false', async () => {
        const abortError = new Error('aborted')
        abortError.name = 'AbortError'
        const fetcher = vi.fn().mockRejectedValue(abortError)

        const { result } = renderHook(() => useCachedResource({ cacheKey: 'abort-key', fetcher }))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.error).toBe('')
        expect(result.current.data).toBeNull()
    })

    it('cancela la petición anterior si cacheKey cambia antes de que resuelva', async () => {
        const abortSpies: Mock[] = []
        const fetcher = vi.fn((signal: AbortSignal) => {
            const spy = vi.fn()
            signal.addEventListener('abort', spy)
            abortSpies.push(spy)
            return new Promise(() => {}) // nunca resuelve
        })

        const { rerender } = renderHook(
            ({ cacheKey }: { cacheKey: string }) => useCachedResource({ cacheKey, fetcher }),
            {
                initialProps: { cacheKey: 'primera' }
            }
        )

        rerender({ cacheKey: 'segunda' })

        expect(abortSpies[0]).toHaveBeenCalledTimes(1)
    })

    it('cancela la petición en curso al desmontar', () => {
        const abortSpy = vi.fn()
        const fetcher = vi.fn((signal: AbortSignal) => {
            signal.addEventListener('abort', abortSpy)
            return new Promise(() => {})
        })

        const { unmount } = renderHook(() => useCachedResource({ cacheKey: 'x', fetcher }))
        unmount()

        expect(abortSpy).toHaveBeenCalledTimes(1)
    })
})
