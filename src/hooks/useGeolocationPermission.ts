import { useCallback, useState } from 'react'
import { getCurrentPosition } from '../lib/api.js'
import { messages } from '../lib/messages.js'

export type PermissionStatus =
    'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'error'

interface UseGeolocationPermissionResult {
    status: PermissionStatus
    message: string
    requestPermission: () => Promise<void>
}

export function useGeolocationPermission(): UseGeolocationPermissionResult {
    const [status, setStatus] = useState<PermissionStatus>('idle')
    const [message, setMessage] = useState('')

    const requestPermission = useCallback(async () => {
        if (!navigator.geolocation) {
            setStatus('unsupported')
            setMessage(messages.permission.unsupported)
            return
        }

        setStatus('requesting')
        setMessage(messages.permission.requesting)

        try {
            await getCurrentPosition()
            setStatus('granted')
            setMessage(messages.permission.granted)
        } catch (error) {
            const isPermissionDenied =
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                'PERMISSION_DENIED' in error &&
                (error as GeolocationPositionError).code ===
                    (error as GeolocationPositionError).PERMISSION_DENIED

            if (isPermissionDenied) {
                setStatus('denied')
                setMessage(messages.permission.denied)
            } else {
                setStatus('error')
                setMessage(messages.permission.error)
            }
        }
    }, [])

    return { status, message, requestPermission }
}
