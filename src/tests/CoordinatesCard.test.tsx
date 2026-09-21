import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from './test-utils.js'
import userEvent from '@testing-library/user-event'

vi.mock('../lib/api.js', () => ({
    getCurrentPosition: vi.fn()
}))

import { getCurrentPosition } from '../lib/api.js'
import { CoordinatesCard } from '../components/CoordinatesCard.js'

const mockedGetCurrentPosition = vi.mocked(getCurrentPosition)

describe('CoordinatesCard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renderiza las coordenadas obtenidas en la tabla', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockResolvedValue({
            coords: { latitude: -24.19, longitude: -65.3 }
        } as GeolocationPosition)

        render(<CoordinatesCard />)
        await user.click(screen.getByRole('button', { name: 'Obtener mis coordenadas' }))

        expect(await screen.findByRole('cell', { name: '-24.19' })).toBeInTheDocument()
        expect(screen.getByRole('cell', { name: '-65.3' })).toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Latitud' })).toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Longitud' })).toBeInTheDocument()
    })

    it('deshabilita el botón mientras obtiene las coordenadas', async () => {
        const user = userEvent.setup()
        let resolvePosition: (position: GeolocationPosition) => void = () => {}
        mockedGetCurrentPosition.mockReturnValue(
            new Promise(resolve => {
                resolvePosition = resolve
            })
        )

        render(<CoordinatesCard />)
        const button = screen.getByRole('button', { name: 'Obtener mis coordenadas' })
        await user.click(button)

        expect(button).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Obteniendo…' })).toBeDisabled()

        resolvePosition({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition)
        expect(await screen.findAllByRole('cell', { name: '0' })).toHaveLength(2)
    })

    it('muestra el error en una alerta y no deja la tabla visible si falla', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockRejectedValue(new Error('permiso rechazado'))

        render(<CoordinatesCard />)
        await user.click(screen.getByRole('button', { name: 'Obtener mis coordenadas' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'No se pudo obtener la ubicación: permiso rechazado'
        )
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
})
