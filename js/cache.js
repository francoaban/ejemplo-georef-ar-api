const CACHE_PREFIX = 'georef_cache_'

/**
 * Caché que dura únicamente la sesión del navegador: se apoya en
 * sessionStorage (nativo, sin librerías), que se borra solo al cerrar
 * la pestaña. No tiene vencimiento propio: mientras la pestaña siga
 * abierta, el dato cacheado se reutiliza sin volver a golpear la API.
 */
export function getFromCache(key) {
    try {
        const raw = sessionStorage.getItem(CACHE_PREFIX + key)
        return raw ? JSON.parse(raw) : null
    } catch {
        // sessionStorage puede fallar en modo privado o por cuota excedida;
        // en ese caso simplemente no usamos caché.
        return null
    }
}

export function saveToCache(key, value) {
    try {
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
    } catch {
        // Si falla el guardado, la app sigue funcionando sin caché.
    }
}