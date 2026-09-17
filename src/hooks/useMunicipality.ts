import { useCallback, useState } from 'react'
import { API_BASE, fetchJson, getCurrentPosition } from '../lib/api.js'
import { parseUbicacionResponse } from '../lib/schemas.js'
import { messages } from '../lib/messages.js'
import { reportError } from '../lib/telemetry.js'

export interface Municipality {
    provincia: string
    departamento: string
    municipio: string
}

interface UseMunicipalityResult {
    municipality: Municipality | null
    loading: boolean
    error: string
    fetchMunicipality: () => Promise<void>
}

export function useMunicipality(): UseMunicipalityResult {
    const [municipality, setMunicipality] = useState<Municipality | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const fetchMunicipality = useCallback(async () => {
        setLoading(true)
        setError('')
        setMunicipality(null)
        try {
            const position = await getCurrentPosition()
            const { latitude, longitude } = position.coords
            const response = await fetchJson(
                `${API_BASE}/ubicacion?lat=${latitude}&lon=${longitude}`
            )
            const location = parseUbicacionResponse(response)

            if (
                location.departamento.nombre ||
                location.municipio.nombre ||
                location.provincia.nombre
            ) {
                setMunicipality({
                    provincia: location.provincia.nombre ?? '—',
                    departamento: location.departamento.nombre ?? '—',
                    municipio: location.municipio.nombre ?? '—'
                })
            } else {
                setError(messages.municipality.notFound)
            }
        } catch (err) {
            const mensaje = err instanceof Error ? err.message : 'Error desconocido'
            reportError(err, { source: 'useMunicipality' })
            setError(messages.municipality.error(mensaje))
        } finally {
            setLoading(false)
        }
    }, [])

    return { municipality, loading, error, fetchMunicipality }
}
