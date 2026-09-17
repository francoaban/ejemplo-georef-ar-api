export const API_BASE = 'https://apis.datos.gob.ar/georef/api'

const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 500

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchJson(url: string, signal?: AbortSignal, attempt = 0): Promise<unknown> {
    try {
        const response = await fetch(url, { signal })
        if (!response.ok) {
            throw new Error(`La API respondió con estado ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error
        if (attempt >= MAX_RETRIES) throw error

        await wait(RETRY_BASE_DELAY_MS * 2 ** attempt)
        return fetchJson(url, signal, attempt + 1)
    }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('La geolocalización no está disponible en este navegador'))
            return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })
}
