import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from './test-utils.js'
import userEvent from '@testing-library/user-event'

vi.mock('../lib/api.js', () => ({
    API_BASE: 'https://apis.datos.gob.ar/georef/api',
    fetchJson: vi.fn(),
    getCurrentPosition: vi.fn()
}))

import { fetchJson, getCurrentPosition } from '../lib/api.js'
import App from '../App.js'

const mockedFetchJson = vi.mocked(fetchJson)
const mockedGetCurrentPosition = vi.mocked(getCurrentPosition)

beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.stubGlobal('navigator', { geolocation: {} })
    mockedFetchJson.mockResolvedValue({ provincias: [{ id: '38', nombre: 'Jujuy' }] })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('App: flujo de permiso y visibilidad del contenido', () => {
    it('al arrancar solo muestra la tarjeta de permiso', () => {
        render(<App />)

        expect(screen.getByRole('heading', { name: 'Permiso de ubicación' })).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: 'Coordenadas actuales' })
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: 'Listar localidades' })
        ).not.toBeInTheDocument()
    })

    it('al conceder el permiso, oculta la tarjeta de permiso y revela el resto del contenido (sin bloquear con alert)', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockResolvedValue({ coords: {} } as GeolocationPosition)
        render(<App />)

        await user.click(screen.getByRole('button', { name: 'Permitir acceso a mi ubicación' }))

        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Coordenadas actuales' })
            ).toBeInTheDocument()
        })

        expect(
            screen.queryByRole('heading', { name: 'Permiso de ubicación' })
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Municipio en el que me encuentro' })
        ).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Listar localidades' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Listar municipios' })).toBeInTheDocument()
    })

    it('un error posterior al permiso es visible, no queda oculto en la sección de permiso', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition
            .mockResolvedValueOnce({ coords: {} } as GeolocationPosition)
            .mockRejectedValueOnce(new Error('Timeout de red'))

        render(<App />)

        await user.click(screen.getByRole('button', { name: 'Permitir acceso a mi ubicación' }))
        await waitFor(() => {
            expect(
                screen.getByRole('heading', { name: 'Coordenadas actuales' })
            ).toBeInTheDocument()
        })

        expect(
            screen.queryByRole('heading', { name: 'Permiso de ubicación' })
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Obtener mis coordenadas' }))

        const error = await screen.findByRole('alert')
        expect(error).toHaveTextContent('No se pudo obtener la ubicación: Timeout de red')
        expect(error).toBeVisible()
    })

    it('un error al cargar provincias se muestra y no bloquea las tarjetas de coordenadas/municipio', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockResolvedValue({ coords: {} } as GeolocationPosition)
        mockedFetchJson.mockRejectedValue(new Error('servicio caído'))

        render(<App />)
        await user.click(screen.getByRole('button', { name: 'Permitir acceso a mi ubicación' }))

        const error = await screen.findByRole('alert')
        expect(error).toHaveTextContent('No se pudieron cargar las provincias')
        expect(screen.getByRole('heading', { name: 'Coordenadas actuales' })).toBeInTheDocument()
    })
})
