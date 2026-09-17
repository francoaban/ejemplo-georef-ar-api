export interface ErrorContext {
    [key: string]: unknown
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
    console.error('[telemetry]', error, context)
}
