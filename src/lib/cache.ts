const CACHE_PREFIX = 'georef_cache_'

export function getFromCache<T>(key: string): T | null {
    try {
        const raw = sessionStorage.getItem(CACHE_PREFIX + key)
        return raw ? (JSON.parse(raw) as T) : null
    } catch {
        return null
    }
}

export function saveToCache<T>(key: string, value: T): void {
    try {
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
    } catch {
        // Si falla el guardado, la app sigue funcionando sin caché.
    }
}
