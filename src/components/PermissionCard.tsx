import { useEffect } from 'react'
import {
    useGeolocationPermission,
    type PermissionStatus
} from '../hooks/useGeolocationPermission.js'
import { useLocale } from '../i18n/localeContext.js'
import {
    buttonClasses,
    cardClasses,
    cardTextClasses,
    cardTitleClasses
} from '../styles/variants.js'

interface PermissionCardProps {
    onGranted: () => void
}

export function PermissionCard({ onGranted }: PermissionCardProps) {
    const { status, message, requestPermission } = useGeolocationPermission()
    const { messages } = useLocale()

    useEffect(() => {
        if (status === 'granted') onGranted()
    }, [status, onGranted])

    const buttonLabels: Partial<Record<PermissionStatus, string>> = {
        granted: messages.permission.buttonGranted,
        denied: messages.permission.buttonRetry,
        error: messages.permission.buttonRetry
    }
    const isRetry = status === 'denied' || status === 'error'
    const isBusy = status === 'requesting' || status === 'granted'

    return (
        <section
            className={`${cardClasses('warning')} col-span-full`}
            aria-labelledby="permission-title"
        >
            <h2 id="permission-title" className={cardTitleClasses}>
                {messages.permission.title}
            </h2>
            <p className={`m-0 ${cardTextClasses}`}>{messages.permission.text}</p>
            <button
                type="button"
                className={buttonClasses(isRetry ? 'retry' : 'primary')}
                onClick={requestPermission}
                disabled={isBusy}
            >
                {buttonLabels[status] ?? messages.permission.buttonDefault}
            </button>
            <output
                className="empty:hidden flex min-h-[1.4em] items-center gap-2 text-[0.9rem] text-warning"
                aria-live="polite"
            >
                {message}
            </output>
        </section>
    )
}
