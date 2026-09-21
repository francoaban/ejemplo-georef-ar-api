import { Component, type ErrorInfo, type ReactNode } from 'react'
import { LocaleContext, type LocaleContextValue } from '../i18n/localeContext.js'
import { es as fallbackMessages } from '../locales/es.js'
import { reportError } from '../lib/telemetry.js'
import { cardClasses, cardTextClasses, cardTitleClasses } from '../styles/variants.js'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    static contextType = LocaleContext
    declare context: LocaleContextValue | null

    state: ErrorBoundaryState = { hasError: false }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        reportError(error, { componentStack: info.componentStack })
    }

    render() {
        if (this.state.hasError) {
            const messages = this.context?.messages ?? fallbackMessages
            return (
                <div className={`${cardClasses('warning')} tablet:col-span-2`} role="alert">
                    <h2 className={cardTitleClasses}>{messages.errorBoundary.title}</h2>
                    <p className={cardTextClasses}>{messages.errorBoundary.text}</p>
                </div>
            )
        }

        return this.props.children
    }
}
