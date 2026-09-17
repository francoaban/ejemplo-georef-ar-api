import { useCallback, useState } from 'react'
import { useCachedResource } from './useCachedResource.js'
import { API_BASE, fetchJson } from '../lib/api.js'
import { parseListResponse, type NamedItem } from '../lib/schemas.js'
import { sortByName } from '../lib/sortByName.js'
import { messages } from '../lib/messages.js'

export type ListEndpoint = 'localidades' | 'municipios'

interface UseProvinceListResult {
    province: string
    setProvince: (province: string) => void
    items: NamedItem[]
    loading: boolean
    error: string
}

export function useProvinceList(endpoint: ListEndpoint): UseProvinceListResult {
    const [province, setProvince] = useState('-1')

    const fetcher = useCallback(
        async (signal: AbortSignal) => {
            const response = await fetchJson(
                `${API_BASE}/${endpoint}?provincia=${province}&campos=nombre&max=1000`,
                signal
            )
            return sortByName(parseListResponse(response, endpoint))
        },
        [endpoint, province]
    )

    const cacheKey = province === '-1' ? null : `${endpoint}:${province}`
    const { data, loading, error } = useCachedResource<NamedItem[]>({ cacheKey, fetcher })

    return {
        province,
        setProvince,
        items: data ?? [],
        loading,
        error: error ? messages.provinceList.error(error) : ''
    }
}
