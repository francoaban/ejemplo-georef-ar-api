import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../js/api.js', () => ({
    API_BASE: 'https://apis.datos.gob.ar/georef/api',
    fetchJson: vi.fn(),
    getCurrentPosition: vi.fn()
}))

import { fetchJson, getCurrentPosition } from '../js/api.js'
import { requestLocationPermission, getCoordinates, getMunicipality } from '../js/geolocation.js'

function setupDom() {
    document.body.innerHTML = `
        <p id="permission-status"></p>
        <button id="permission-button"></button>
        <table id="coordinates-table" class="is-hidden"></table>
        <span id="latitude-value"></span>
        <span id="longitude-value"></span>
        <table id="municipality-table" class="is-hidden">
            <tbody id="municipality-table-body"></tbody>
        </table>
    `
}

beforeEach(() => {
    setupDom()
    vi.clearAllMocks()
    // Por defecto simulamos que el navegador SÍ soporta geolocalización;
    // los métodos reales de la Geolocation API no se usan porque
    // getCurrentPosition está mockeado desde api.js.
    vi.stubGlobal('navigator', { geolocation: {} })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('requestLocationPermission', () => {
    it('deshabilita el botón mientras espera y confirma el permiso concedido', async () => {
        getCurrentPosition.mockResolvedValue({ coords: {} })
        const onGranted = vi.fn()

        const promise = requestLocationPermission({ onGranted })
        expect(document.getElementById('permission-button').disabled).toBe(true)

        await promise

        expect(document.getElementById('permission-status').innerText).toContain('Permiso concedido')
        expect(document.getElementById('permission-button').innerText).toBe('Permiso concedido')
        expect(onGranted).toHaveBeenCalledTimes(1)
    })

    it('pasa el botón a modo "Reintentar" cuando el usuario deniega el permiso', async () => {
        const deniedError = { code: 1, PERMISSION_DENIED: 1 }
        getCurrentPosition.mockRejectedValue(deniedError)
        const onGranted = vi.fn()

        await requestLocationPermission({ onGranted })

        const button = document.getElementById('permission-button')
        expect(button.disabled).toBe(false)
        expect(button.classList.contains('button--retry')).toBe(true)
        expect(button.innerText).toBe('Reintentar')
        expect(onGranted).not.toHaveBeenCalled()
    })

    it('muestra un mensaje genérico ante errores que no son de permiso denegado', async () => {
        getCurrentPosition.mockRejectedValue({ code: 2 })

        await requestLocationPermission()

        expect(document.getElementById('permission-status').innerText).toContain(
            'No se pudo obtener el permiso de ubicación'
        )
    })

    it('informa cuando el navegador no soporta geolocalización, sin llamar a getCurrentPosition', async () => {
        vi.stubGlobal('navigator', {})

        await requestLocationPermission()

        expect(getCurrentPosition).not.toHaveBeenCalled()
        expect(document.getElementById('permission-status').innerText).toContain(
            'no está disponible en este navegador'
        )
    })
})

describe('getCoordinates', () => {
    it('muestra latitud, longitud y revela la tabla de coordenadas', async () => {
        getCurrentPosition.mockResolvedValue({ coords: { latitude: -24.19, longitude: -65.3 } })

        await getCoordinates()

        expect(document.getElementById('latitude-value').innerText).toBe(-24.19)
        expect(document.getElementById('longitude-value').innerText).toBe(-65.3)
        expect(document.getElementById('coordinates-table').classList.contains('is-hidden')).toBe(false)
    })

    it('muestra un error si no se pudo obtener la posición', async () => {
        getCurrentPosition.mockRejectedValue(new Error('denegado'))

        await getCoordinates()

        expect(document.getElementById('permission-status').innerText).toContain(
            'No se pudo obtener la ubicación'
        )
        expect(document.getElementById('coordinates-table').classList.contains('is-hidden')).toBe(true)
    })
})

describe('getMunicipality', () => {
    it('consulta la API con lat/lon y renderiza provincia, departamento y municipio', async () => {
        getCurrentPosition.mockResolvedValue({ coords: { latitude: -24.19, longitude: -65.3 } })
        fetchJson.mockResolvedValue({
            ubicacion: {
                provincia: { nombre: 'Jujuy' },
                departamento: { nombre: 'Dr. Manuel Belgrano' },
                municipio: { nombre: 'San Salvador de Jujuy' }
            }
        })

        await getMunicipality()

        expect(fetchJson).toHaveBeenCalledWith(
            expect.stringContaining('lat=-24.19&lon=-65.3')
        )
        const fila = document.getElementById('municipality-table-body')
        expect(fila.textContent).toContain('Jujuy')
        expect(fila.textContent).toContain('San Salvador de Jujuy')
        expect(document.getElementById('municipality-table').classList.contains('is-hidden')).toBe(false)
    })

    it('escapa nombres antes de insertarlos en la tabla', async () => {
        getCurrentPosition.mockResolvedValue({ coords: { latitude: 0, longitude: 0 } })
        fetchJson.mockResolvedValue({
            ubicacion: {
                provincia: { nombre: '<b>Falsa</b>' },
                departamento: { nombre: 'X' },
                municipio: { nombre: 'Y' }
            }
        })

        await getMunicipality()

        const fila = document.getElementById('municipality-table-body')
        expect(fila.querySelector('b')).toBeNull()
        expect(fila.innerHTML).toContain('&lt;b&gt;Falsa&lt;/b&gt;')
    })

    it('muestra "Municipio no encontrado" si la API no devuelve ningún nombre', async () => {
        getCurrentPosition.mockResolvedValue({ coords: { latitude: 0, longitude: 0 } })
        fetchJson.mockResolvedValue({
            ubicacion: { provincia: {}, departamento: {}, municipio: {} }
        })

        await getMunicipality()

        expect(document.getElementById('permission-status').innerText).toBe('Municipio no encontrado')
        expect(document.getElementById('municipality-table').classList.contains('is-hidden')).toBe(true)
    })

    it('muestra un error si la consulta a la API falla', async () => {
        getCurrentPosition.mockResolvedValue({ coords: { latitude: 0, longitude: 0 } })
        fetchJson.mockRejectedValue(new Error('boom'))

        await getMunicipality()

        expect(document.getElementById('permission-status').innerText).toContain(
            'No se pudo consultar la ubicación'
        )
    })
})
