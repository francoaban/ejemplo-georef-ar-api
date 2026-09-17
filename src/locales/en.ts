import type { MessagesShape } from './es.js'

/**
 * English translation.
 *
 * Deliberately typed with `satisfies MessagesShape`, not
 * `: MessagesShape`. The difference matters:
 *
 * - `const en: MessagesShape = {...}` would WIDEN every literal to its
 *   base type (each string becomes `string`, losing the literal), and
 *   more importantly it lets TypeScript silently allow an EXTRA key
 *   that doesn't exist in `es.ts` without complaint, since structural
 *   typing only requires "at least these fields".
 * - `const en = {...} satisfies MessagesShape` checks the object
 *   against the shape (every key required, correct value type per
 *   key: string vs function) while still letting TypeScript infer the
 *   precise literal types for `en` itself.
 *
 * Practical effect: delete a key here, misspell one, or turn a
 * `(msg: string) => string` into a plain string, and this file fails
 * to compile — `pnpm typecheck` (and CI) catches it before it ships,
 * not a user noticing a missing translation in production.
 */
export const en = {
    header: {
        eyebrow: 'Argentina Geolocation',
        title: 'My Location',
        description:
            'Look up your coordinates and municipality, and browse the list of localities across the country using the datos.gob.ar API.'
    },
    permission: {
        title: 'Location Permission',
        text: "To find out where you are, we need you to allow access to your device's location.",
        buttonDefault: 'Allow access to my location',
        buttonGranted: 'Permission granted',
        buttonRetry: 'Retry',
        unsupported: 'Geolocation is not available in this browser.',
        requesting: 'Waiting for browser authorization...',
        granted: 'Permission granted. You can now check your location.',
        denied: 'Permission denied. You can retry or enable it from your browser settings.',
        error: 'Could not obtain location permission.'
    },
    coordinates: {
        title: 'Current Coordinates',
        buttonDefault: 'Get my coordinates',
        buttonLoading: 'Getting…',
        latitud: 'Latitude',
        longitud: 'Longitude',
        caption: 'Latitude and longitude of your location',
        error: (message: string) => `Could not get your location: ${message}`
    },
    municipality: {
        title: 'Municipality I’m In',
        buttonDefault: 'Detect my municipality',
        buttonLoading: 'Detecting…',
        provincia: 'Province',
        departamento: 'Department',
        municipio: 'Municipality',
        caption: 'Detected province, department, and municipality',
        notFound: 'Municipality not found',
        error: (message: string) => `Could not look up your location: ${message}`
    },
    provinceList: {
        localitiesTitle: 'List Localities',
        municipalitiesTitle: 'List Municipalities',
        provinciaLabel: 'Province',
        loadingProvincias: 'Loading list of provinces…',
        selectPlaceholder: 'Select a province',
        loading: 'Loading…',
        error: (message: string) => `Could not load the list: ${message}`
    },
    provinces: {
        error: (message: string) => `Could not load the provinces: ${message}`
    },
    errorBoundary: {
        title: 'Something went wrong',
        text: 'An unexpected error occurred. Try reloading the page; if the problem persists, the external API might be having issues.'
    }
} satisfies MessagesShape
