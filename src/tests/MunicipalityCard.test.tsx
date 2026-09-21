import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from './test-utils.js'
import userEvent from '@testing-library/user-event'

vi.mock('../lib/api.js', () => ({
    API_BASE: 'https://apis.datos.gob.ar/georef/api',
    fetchJson: vi.fn(),
    getCurrentPosition: vi.fn()
}))

import { fetchJson, getCurrentPosition } from '../lib/api.js'
import { MunicipalityCard } from '../components/MunicipalityCard.js'

const mockedFetchJson = vi.mocked(fetchJson)
const mockedGetCurrentPosition = vi.mocked(getCurrentPosition)

describe('MunicipalityCard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renderiza provincia, departamento y municipio en la tabla', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockResolvedValue({
            coords: { latitude: -24.19, longitude: -65.3 }
        } as GeolocationPosition)
        mockedFetchJson.mockResolvedValue({
            ubicacion: {
                provincia: { nombre: 'Jujuy' },
                departamento: { nombre: 'Dr. Manuel Belgrano' },
                municipio: { nombre: 'San Salvador de Jujuy' }
            }
        })

        render(<MunicipalityCard />)
        await user.click(screen.getByRole('button', { name: 'Detectar mi municipio' }))

        expect(await screen.findByRole('cell', { name: 'Jujuy' })).toBeInTheDocument()
        expect(screen.getByRole('cell', { name: 'Dr. Manuel Belgrano' })).toBeInTheDocument()
        expect(screen.getByRole('cell', { name: 'San Salvador de Jujuy' })).toBeInTheDocument()
        expect(mockedFetchJson).toHaveBeenCalledWith(
            expect.stringContaining('lat=-24.19&lon=-65.3')
        )
    })

    it('deshabilita el botón mientras consulta la ubicación', async () => {
        const user = userEvent.setup()
        let resolvePosition: (position: GeolocationPosition) => void = () => {}
        mockedGetCurrentPosition.mockReturnValue(
            new Promise(resolve => {
                resolvePosition = resolve
            })
        )

        render(<MunicipalityCard />)
        await user.click(screen.getByRole('button', { name: 'Detectar mi municipio' }))

        expect(screen.getByRole('button', { name: 'Detectando…' })).toBeDisabled()

        resolvePosition({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition)
        mockedFetchJson.mockResolvedValue({
            ubicacion: { provincia: {}, departamento: {}, municipio: {} }
        })
        expect(await screen.findByRole('alert')).toHaveTextContent('Municipio no encontrado')
    })

    it('muestra el error accesible y no deja una tabla visible si falla la consulta', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockResolvedValue({ coords: {} } as GeolocationPosition)
        mockedFetchJson.mockRejectedValue(new Error('servicio caído'))

        render(<MunicipalityCard />)
        await user.click(screen.getByRole('button', { name: 'Detectar mi municipio' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'No se pudo consultar la ubicación: servicio caído'
        )
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
})
