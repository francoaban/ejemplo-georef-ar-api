import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../lib/api.js', () => ({
    getCurrentPosition: vi.fn()
}))

import { getCurrentPosition } from '../lib/api.js'
import { PermissionCard } from '../components/PermissionCard.js'

const mockedGetCurrentPosition = vi.mocked(getCurrentPosition)

beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('navigator', { geolocation: {} })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('PermissionCard', () => {
    it('llama a onGranted cuando el navegador concede el permiso', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockResolvedValue({ coords: {} } as GeolocationPosition)
        const onGranted = vi.fn()

        render(<PermissionCard onGranted={onGranted} />)
        await user.click(screen.getByRole('button', { name: 'Permitir acceso a mi ubicación' }))

        await waitFor(() => expect(onGranted).toHaveBeenCalledTimes(1))
    })

    it('muestra "Reintentar" cuando el permiso es denegado', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockRejectedValue({
            code: 1,
            PERMISSION_DENIED: 1
        } as GeolocationPositionError)

        render(<PermissionCard onGranted={vi.fn()} />)
        await user.click(screen.getByRole('button', { name: 'Permitir acceso a mi ubicación' }))

        const button = await screen.findByRole('button', { name: 'Reintentar' })
        expect(button).toBeEnabled()
    })

    /**
     * Antes de este fix, solo 'denied' (permiso rechazado) recibía el
     * botón de "Reintentar"; 'error' (otro fallo del navegador, sin
     * relación con el permiso) dejaba el botón en su estado original,
     * una inconsistencia sin justificación funcional.
     */
    it('también muestra "Reintentar" ante un error que no es de permiso denegado', async () => {
        const user = userEvent.setup()
        mockedGetCurrentPosition.mockRejectedValue({
            code: 2
        } as unknown as GeolocationPositionError)

        render(<PermissionCard onGranted={vi.fn()} />)
        await user.click(screen.getByRole('button', { name: 'Permitir acceso a mi ubicación' }))

        const button = await screen.findByRole('button', { name: 'Reintentar' })
        expect(button).toBeEnabled()
    })

    it('informa cuando el navegador no soporta geolocalización', async () => {
        vi.stubGlobal('navigator', {})
        const user = userEvent.setup()

        render(<PermissionCard onGranted={vi.fn()} />)
        await user.click(screen.getByRole('button', { name: 'Permitir acceso a mi ubicación' }))

        expect(await screen.findByText(/no está disponible en este navegador/)).toBeInTheDocument()
    })
})
