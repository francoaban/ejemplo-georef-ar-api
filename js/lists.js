import { API_BASE, fetchJson } from './api.js'
import { getFromCache, saveToCache } from './cache.js'
import { escapeHtml } from './dom-utils.js'
import { showError } from './status.js'

// Controladores activos por select, para poder cancelar una consulta
// si el usuario cambia de provincia antes de que responda la anterior.
const activeControllers = new Map()

export async function loadProvinces() {
    try {
        const cached = getFromCache('provinces')
        const provinces = cached ?? await (async () => {
            const response = await fetchJson(`${API_BASE}/provincias?campos=nombre&max=30`)
            saveToCache('provinces', response.provincias)
            return response.provincias
        })()

        const sorted = [...provinces].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        const optionsHtml = '<option value="-1">Seleccione una provincia</option>' +
            sorted.map(province => `<option value="${province.id}">${escapeHtml(province.nombre)}</option>`).join('')

        document.getElementById('localities-province-select').innerHTML = optionsHtml
        document.getElementById('municipalities-province-select').innerHTML = optionsHtml
    } catch (error) {
        showError(`No se pudieron cargar las provincias: ${error.message}`)
    }
}

function setLoadingState(container, isLoading) {
    container.setAttribute('aria-busy', String(isLoading))
    if (isLoading) {
        container.innerHTML = '<p class="result-list__loading"><span class="spinner" aria-hidden="true"></span>Cargando…</p>'
    }
}

function renderList(container, items) {
    const sorted = [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    container.innerHTML = '<ol>' + sorted.map(item => `<li>${escapeHtml(item.nombre)}</li>`).join('') + '</ol>'
    container.setAttribute('aria-busy', 'false')
}

/**
 * Carga un listado (localidades o municipios) según la provincia
 * seleccionada en un <select>. Una sola función genérica reemplaza
 * la lógica que antes estaba duplicada entre ambos casos.
 */
export async function loadList({ selectId, endpoint, containerId }) {
    const selectEl = document.getElementById(selectId)
    const province = selectEl.value
    const containerEl = document.getElementById(containerId)

    if (province === '-1') {
        containerEl.innerHTML = ''
        containerEl.setAttribute('aria-busy', 'false')
        return
    }

    const cacheKey = `${endpoint}:${province}`

    activeControllers.get(selectId)?.abort()

    const cached = getFromCache(cacheKey)
    if (cached) {
        renderList(containerEl, cached)
        return
    }

    const controller = new AbortController()
    activeControllers.set(selectId, controller)

    setLoadingState(containerEl, true)

    try {
        const response = await fetchJson(
            `${API_BASE}/${endpoint}?provincia=${province}&campos=nombre&max=1000`,
            controller.signal
        )
        const items = response[endpoint]
        saveToCache(cacheKey, items)
        renderList(containerEl, items)
    } catch (error) {
        if (error.name === 'AbortError') return
        showError(`No se pudo cargar el listado: ${error.message}`)
        containerEl.innerHTML = ''
        containerEl.setAttribute('aria-busy', 'false')
    }
}