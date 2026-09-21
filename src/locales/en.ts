import type { MessagesShape } from './es.js'

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
