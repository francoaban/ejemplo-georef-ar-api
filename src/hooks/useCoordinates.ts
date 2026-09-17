import { useCallback, useState } from 'react'
import { getCurrentPosition } from '../lib/api.js'
import { messages } from '../lib/messages.js'
import { reportError } from '../lib/telemetry.js'

export interface Coordinates {
    latitude: number
    longitude: number
}

interface UseCoordinatesResult {
    coordinates: Coordinates | null
    loading: boolean
    error: string
    fetchCoordinates: () => Promise<void>
}

export function useCoordinates(): UseCoordinatesResult {
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchCoordinates = useCallback(async () => {
        setLoading(true)
        setError('')
        setCoordinates(null)
        try {
            const position = await getCurrentPosition()
            setCoordinates({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            })
        } catch (err) {
            const mensaje = err instanceof Error ? err.message : 'Error desconocido'
            reportError(err, { source: 'useCoordinates' })
            setError(messages.coordinates.error(mensaje))
        } finally {
            setLoading(false)
        }
    }, [])

    return { coordinates, loading, error, fetchCoordinates }
}
