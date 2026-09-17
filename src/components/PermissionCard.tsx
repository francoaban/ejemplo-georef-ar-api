import { useEffect } from 'react'
import {
    useGeolocationPermission,
    type PermissionStatus
} from '../hooks/useGeolocationPermission.js'
import { messages } from '../lib/messages.js'

interface PermissionCardProps {
    onGranted: () => void
}

const BUTTON_LABELS: Partial<Record<PermissionStatus, string>> = {
    granted: messages.permission.buttonGranted,
    denied: messages.permission.buttonRetry,
    error: messages.permission.buttonRetry
}

export function PermissionCard({ onGranted }: PermissionCardProps) {
    const { status, message, requestPermission } = useGeolocationPermission()

    // Notifica al padre una sola vez, cuando el status pasa a 'granted'.
    useEffect(() => {
        if (status === 'granted') onGranted()
    }, [status, onGranted])

    // 'denied' (permiso rechazado) y 'error' (otro fallo del navegador,
    // p. ej. timeout) son, para el usuario, el mismo caso: algo no
    // funcionó y puede reintentar. Ambos reciben el mismo tratamiento.
    const isRetry = status === 'denied' || status === 'error'
    const isBusy = status === 'requesting' || status === 'granted'

    return (
        <section className="col-span-full flex flex-col gap-[0.9rem] rounded-card border border-border border-l-4 border-l-warning bg-surface p-6 shadow-card" aria-labelledby="permission-title">
            <h2 id="permission-title" className="text-[1.15rem]">
                {messages.permission.title}
            </h2>
            <p className="m-0 text-muted">{messages.permission.text}</p>
            <button
                type="button"
                className={`self-start rounded-lg border px-[1.2rem] py-[0.65rem] font-body text-[0.95rem] font-semibold inline-flex cursor-pointer items-center gap-2 transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 ${isRetry ? 'border-warning bg-warning-bg text-warning' : 'border-transparent bg-accent text-white hover:bg-accent-dark'} motion-reduce:transition-none`}
                onClick={requestPermission}
                disabled={isBusy}
            >
                {BUTTON_LABELS[status] ?? messages.permission.buttonDefault}
            </button>
            <output className="empty:hidden min-h-[1.4em] flex items-center gap-2 text-[0.9rem] text-warning" aria-live="polite">
                {message}
            </output>
        </section>
    )
}
