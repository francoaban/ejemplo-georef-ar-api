import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../js/api.js', () => ({
    API_BASE: 'https://apis.datos.gob.ar/georef/api',
    fetchJson: vi.fn()
}))
vi.mock('../js/cache.js', () => ({
    getFromCache: vi.fn(),
    saveToCache: vi.fn()
}))
vi.mock('../js/status.js', () => ({
    showError: vi.fn(),
    clearError: vi.fn()
}))

import { fetchJson } from '../js/api.js'
import { getFromCache, saveToCache } from '../js/cache.js'
import { showError } from '../js/status.js'
import { loadProvinces, loadList } from '../js/lists.js'

function setupDom() {
    document.body.innerHTML = `
        <select id="localities-province-select"></select>
        <select id="municipalities-province-select"></select>
        <div id="localities-result"></div>
        <div id="municipalities-result"></div>
    `
}

beforeEach(() => {
    setupDom()
    vi.clearAllMocks()
})

describe('loadProvinces', () => {
    it('consulta la API, cachea y renderiza las provincias ordenadas alfabéticamente', async () => {
        getFromCache.mockReturnValue(null)
        fetchJson.mockResolvedValue({
            provincias: [
                { id: '14', nombre: 'Córdoba' },
                { id: '1', nombre: 'Buenos Aires' }
            ]
        })

        await loadProvinces()

        expect(saveToCache).toHaveBeenCalledWith('provinces', expect.any(Array))

        const select = document.getElementById('localities-province-select')
        const opciones = [...select.querySelectorAll('option')].map(o => o.textContent)
        expect(opciones).toEqual(['Seleccione una provincia', 'Buenos Aires', 'Córdoba'])

        // Ambos selects deben poblarse con las mismas opciones.
        expect(document.getElementById('municipalities-province-select').innerHTML).toContain('Córdoba')
    })

    it('usa la caché sin volver a golpear la API cuando ya hay datos guardados', async () => {
        getFromCache.mockReturnValue([{ id: '38', nombre: 'Jujuy' }])

        await loadProvinces()

        expect(fetchJson).not.toHaveBeenCalled()
        expect(document.getElementById('localities-province-select').innerHTML).toContain('Jujuy')
    })

    it('muestra un mensaje de error si la consulta a la API falla', async () => {
        getFromCache.mockReturnValue(null)
        fetchJson.mockRejectedValue(new Error('Timeout'))

        await loadProvinces()

        expect(showError).toHaveBeenCalledWith(
            expect.stringContaining('No se pudieron cargar las provincias')
        )
    })
})

describe('loadList', () => {
    const localidadesArgs = {
        selectId: 'localities-province-select',
        endpoint: 'localidades',
        containerId: 'localities-result'
    }

    function selectProvince(provinceId) {
        const select = document.getElementById('localities-province-select')
        select.innerHTML = `<option value="${provinceId}" selected>Jujuy</option>`
    }

    it('no consulta nada y limpia el contenedor cuando no hay provincia seleccionada (-1)', async () => {
        selectProvince('-1')
        document.getElementById('localities-result').innerHTML = 'contenido previo'

        await loadList(localidadesArgs)

        expect(fetchJson).not.toHaveBeenCalled()
        expect(document.getElementById('localities-result').innerHTML).toBe('')
    })

    it('renderiza el listado desde caché sin llamar a la API', async () => {
        selectProvince('38')
        getFromCache.mockReturnValue([{ nombre: 'Perico' }, { nombre: 'Abra Pampa' }])

        await loadList(localidadesArgs)

        expect(fetchJson).not.toHaveBeenCalled()
        const container = document.getElementById('localities-result')
        expect(container.innerHTML).toContain('Abra Pampa')
        expect(container.getAttribute('aria-busy')).toBe('false')
    })

    it('consulta la API, cachea con la clave correcta y ordena el resultado alfabéticamente', async () => {
        selectProvince('38')
        getFromCache.mockReturnValue(null)
        fetchJson.mockResolvedValue({
            localidades: [{ nombre: 'Perico' }, { nombre: 'Abra Pampa' }]
        })

        await loadList(localidadesArgs)

        expect(saveToCache).toHaveBeenCalledWith('localidades:38', expect.any(Array))
        const items = [...document.querySelectorAll('#localities-result li')].map(li => li.textContent)
        expect(items).toEqual(['Abra Pampa', 'Perico'])
    })

    it('escapa nombres potencialmente peligrosos antes de insertarlos en el DOM', async () => {
        selectProvince('38')
        getFromCache.mockReturnValue(null)
        fetchJson.mockResolvedValue({
            localidades: [{ nombre: '<img src=x onerror=alert(1)>' }]
        })

        await loadList(localidadesArgs)

        const container = document.getElementById('localities-result')
        expect(container.querySelector('img')).toBeNull()
        expect(container.innerHTML).toContain('&lt;img')
    })

    it('muestra un mensaje de error y limpia el contenedor si la API falla', async () => {
        selectProvince('38')
        getFromCache.mockReturnValue(null)
        fetchJson.mockRejectedValue(new Error('boom'))

        await loadList(localidadesArgs)

        expect(showError).toHaveBeenCalledWith(expect.stringContaining('No se pudo cargar el listado'))
        expect(document.getElementById('localities-result').innerHTML).toBe('')
    })

    it('ignora silenciosamente un AbortError (cambio rápido de provincia)', async () => {
        selectProvince('38')
        getFromCache.mockReturnValue(null)
        const abortError = new Error('aborted')
        abortError.name = 'AbortError'
        fetchJson.mockRejectedValue(abortError)

        await loadList(localidadesArgs)

        expect(showError).not.toHaveBeenCalled()
    })
})
