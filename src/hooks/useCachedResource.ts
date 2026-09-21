import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getFromCache, saveToCache } from '../lib/cache.js'
import { reportError } from '../lib/telemetry.js'

interface UseCachedResourceOptions<T> {
    cacheKey: string | null
    enabled?: boolean
    fetcher: (signal: AbortSignal) => Promise<T>
}

interface UseCachedResourceResult<T> {
    data: T | null
    loading: boolean
    error: string
}

export function useCachedResource<T>({
    cacheKey,
    enabled = true,
    fetcher
}: UseCachedResourceOptions<T>): UseCachedResourceResult<T> {
    const [fetchedData, setFetchedData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const requestIdRef = useRef(0)
    const fetcherRef = useRef(fetcher)

    useLayoutEffect(() => {
        fetcherRef.current = fetcher
    })

    const isActive = enabled && cacheKey != null

    const cached = isActive ? getFromCache<T>(cacheKey) : null

    useEffect(() => {
        if (!isActive) return

        if (getFromCache<T>(cacheKey)) return

        const controller = new AbortController()
        const requestId = ++requestIdRef.current

        setLoading(true)
        setError('')
        setFetchedData(null)

        fetcherRef
            .current(controller.signal)
            .then(result => {
                if (requestIdRef.current !== requestId) return
                saveToCache(cacheKey, result)
                setFetchedData(result)
            })
            .catch((err: unknown) => {
                if (requestIdRef.current !== requestId) return
                if (err instanceof Error && err.name === 'AbortError') return
                reportError(err, { cacheKey })
                setError(err instanceof Error ? err.message : 'Error desconocido')
                setFetchedData(null)
            })
            .finally(() => {
                if (requestIdRef.current === requestId) setLoading(false)
            })

        return () => controller.abort()
    }, [cacheKey, isActive])

    const data = isActive ? (cached ?? fetchedData) : null

    return {
        data,
        loading: isActive && loading,
        error: isActive ? error : ''
    }
}
