import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import './index.css'
import App from './App.js'
import { ErrorBoundary } from './components/ErrorBoundary.js'
import { reportError } from './lib/telemetry.js'

window.addEventListener('unhandledrejection', event => {
    reportError(event.reason, { source: 'unhandledrejection' })
})

const rootElement = document.getElementById('root')
if (!rootElement) {
    throw new Error('No se encontró el elemento #root en index.html')
}

createRoot(rootElement).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>
)
