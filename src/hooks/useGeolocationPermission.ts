import { useCallback, useState } from 'react'
import { getCurrentPosition } from '../lib/api.js'
import { useLocale } from '../i18n/localeContext.js'
import type { MessagesShape } from '../locales/es.js'

export type PermissionStatus =
    'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'error'

interface UseGeolocationPermissionResult {
    status: PermissionStatus
    message: string
    requestPermission: () => Promise<void>
}

function statusMessage(messages: MessagesShape, status: PermissionStatus): string {
    switch (status) {
        case 'unsupported':
            return messages.permission.unsupported
        case 'requesting':
            return messages.permission.requesting
        case 'granted':
            return messages.permission.granted
        case 'denied':
            return messages.permission.denied
        case 'error':
            return messages.permission.error
        case 'idle':
        default:
            return ''
    }
}

export function useGeolocationPermission(): UseGeolocationPermissionResult {
    const [status, setStatus] = useState<PermissionStatus>('idle')
    const { messages } = useLocale()

    const requestPermission = useCallback(async () => {
        if (!navigator.geolocation) {
            setStatus('unsupported')
            return
        }

        setStatus('requesting')

        try {
            await getCurrentPosition()
            setStatus('granted')
        } catch (error) {
            const isPermissionDenied =
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                'PERMISSION_DENIED' in error &&
                (error as GeolocationPositionError).code ===
                    (error as GeolocationPositionError).PERMISSION_DENIED

            setStatus(isPermissionDenied ? 'denied' : 'error')
        }
    }, [])

    return { status, message: statusMessage(messages, status), requestPermission }
}
