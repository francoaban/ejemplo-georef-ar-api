import { Component, type ErrorInfo, type ReactNode } from 'react'
import { messages } from '../lib/messages.js'
import { reportError } from '../lib/telemetry.js'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        reportError(error, { componentStack: info.componentStack })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col gap-[0.9rem] rounded-card border border-border border-l-4 border-l-warning bg-surface p-6 shadow-card" role="alert">
                    <h2 className="text-[1.15rem]">{messages.errorBoundary.title}</h2>
                    <p className="m-0 text-muted">{messages.errorBoundary.text}</p>
                </div>
            )
        }

        return this.props.children
    }
}
