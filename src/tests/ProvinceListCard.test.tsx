import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../lib/api.js', () => ({
    API_BASE: 'https://apis.datos.gob.ar/georef/api',
    fetchJson: vi.fn()
}))

import { fetchJson } from '../lib/api.js'
import { ProvinceListCard } from '../components/ProvinceListCard.js'

const mockedFetchJson = vi.mocked(fetchJson)

const provinces = [
    { id: '38', nombre: 'Jujuy' },
    { id: '1', nombre: 'Buenos Aires' }
]

beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
})

describe('ProvinceListCard', () => {
    it('muestra "Cargando…" en el placeholder mientras se cargan las provincias', () => {
        render(
            <ProvinceListCard
                title="Listar localidades"
                endpoint="localidades"
                provinces={[]}
                provincesLoading
            />
        )

        expect(screen.getByRole('combobox')).toBeDisabled()
        expect(screen.getByText('Cargando listado de provincias…')).toBeInTheDocument()
    })

    it('al elegir una provincia, consulta la API y renderiza el listado ordenado', async () => {
        const user = userEvent.setup()
        mockedFetchJson.mockResolvedValue({
            localidades: [{ nombre: 'Perico' }, { nombre: 'Abra Pampa' }]
        })

        render(
            <ProvinceListCard
                title="Listar localidades"
                endpoint="localidades"
                provinces={provinces}
                provincesLoading={false}
            />
        )

        await user.selectOptions(screen.getByRole('combobox'), 'Jujuy')

        const items = await screen.findAllByRole('listitem')
        expect(items.map(li => li.textContent)).toEqual(['Abra Pampa', 'Perico'])
    })

    it('muestra un error accesible si la API falla', async () => {
        const user = userEvent.setup()
        mockedFetchJson.mockRejectedValue(new Error('caída'))

        render(
            <ProvinceListCard
                title="Listar municipios"
                endpoint="municipios"
                provinces={provinces}
                provincesLoading={false}
            />
        )

        await user.selectOptions(screen.getByRole('combobox'), 'Jujuy')

        const error = await screen.findByRole('alert')
        expect(error).toHaveTextContent('No se pudo cargar el listado')
    })

    it('vuelve a mostrar el listado desde caché sin llamar a la API', async () => {
        sessionStorage.setItem(
            'georef_cache_localidades:38',
            JSON.stringify([{ nombre: 'San Pedro' }])
        )
        const user = userEvent.setup()

        render(
            <ProvinceListCard
                title="Listar localidades"
                endpoint="localidades"
                provinces={provinces}
                provincesLoading={false}
            />
        )

        await user.selectOptions(screen.getByRole('combobox'), 'Jujuy')

        await waitFor(() => {
            expect(screen.getByText('San Pedro')).toBeInTheDocument()
        })
        expect(mockedFetchJson).not.toHaveBeenCalled()
    })
})
