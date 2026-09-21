import { useCallback } from 'react'
import { useCachedResource } from './useCachedResource.js'
import { API_BASE, fetchJson } from '../lib/api.js'
import { parseProvinciasResponse, type Provincia } from '../lib/schemas.js'
import { sortByName } from '../lib/sortByName.js'
import { useLocale } from '../i18n/localeContext.js'

interface UseProvincesResult {
    provinces: Provincia[]
    loading: boolean
    error: string
}

export function useProvinces(enabled: boolean): UseProvincesResult {
    const { messages } = useLocale()

    const fetcher = useCallback(async (signal: AbortSignal) => {
        const response = await fetchJson(`${API_BASE}/provincias?campos=nombre&max=30`, signal)
        return sortByName(parseProvinciasResponse(response))
    }, [])

    const { data, loading, error } = useCachedResource<Provincia[]>({
        cacheKey: 'provinces',
        enabled,
        fetcher
    })

    return {
        provinces: data ?? [],
        loading,
        error: error ? messages.provinces.error(error) : ''
    }
}
