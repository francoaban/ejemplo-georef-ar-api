const API_BASE = 'https://apis.datos.gob.ar/georef/api'
const CACHE_PREFIX = 'georef_cache_'
const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 500

// Controladores activos por select, para poder cancelar una consulta
// si el usuario cambia de provincia antes de que responda la anterior.
const activeControllers = new Map()

/* ---------- Utilidades de seguridad ---------- */

/**
 * Escapa texto antes de insertarlo como HTML, evitando XSS si la fuente
 * de datos llegara a incluir contenido no confiable.
 */
function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text ?? ''
    return div.innerHTML
}

/* ---------- Caché (dura solo la sesión del navegador) ---------- */

function getFromCache(key) {
    try {
        const raw = sessionStorage.getItem(CACHE_PREFIX + key)
        return raw ? JSON.parse(raw) : null
    } catch {
        // sessionStorage puede fallar en modo privado o por cuota excedida;
        // en ese caso simplemente no usamos caché.
        return null
    }
}

function saveToCache(key, value) {
    try {
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
    } catch {
        // Si falla el guardado, la app sigue funcionando sin caché.
    }
}

/* ---------- Red ---------- */

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * fetch con reintentos y backoff exponencial simple, para tolerar
 * caídas momentáneas de red o de la API sin fallar de una.
 */
async function fetchJson(url, signal, attempt = 0) {
    try {
        const response = await fetch(url, { signal })
        if (!response.ok) {
            throw new Error(`La API respondió con estado ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        if (error.name === 'AbortError') throw error
        if (attempt >= MAX_RETRIES) throw error

        await wait(RETRY_BASE_DELAY_MS * 2 ** attempt)
        return fetchJson(url, signal, attempt + 1)
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('La geolocalización no está disponible en este navegador'))
            return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })
}

/* ---------- Mensajes de estado ---------- */

function showError(message) {
    document.getElementById('permission-status').innerText = message
}

function clearError() {
    document.getElementById('permission-status').innerText = ''
}

/* ---------- Permiso de ubicación ---------- */

async function requestLocationPermission() {
    const statusEl = document.getElementById('permission-status')
    const buttonEl = document.getElementById('permission-button')

    if (!navigator.geolocation) {
        statusEl.innerText = 'La geolocalización no está disponible en este navegador.'
        return
    }

    buttonEl.disabled = true
    buttonEl.classList.remove('button--retry')
    statusEl.innerText = 'Esperando autorización del navegador...'

    try {
        await getCurrentPosition()
        statusEl.innerText = 'Permiso concedido. Ya puedes consultar tu ubicación.'
        buttonEl.innerText = 'Permiso concedido'
    } catch (error) {
        buttonEl.disabled = false
        if (error.code === error.PERMISSION_DENIED) {
            statusEl.innerText = 'Permiso denegado. Podés reintentar o habilitarlo desde la configuración del navegador.'
            buttonEl.innerText = 'Reintentar'
            buttonEl.classList.add('button--retry')
        } else {
            statusEl.innerText = 'No se pudo obtener el permiso de ubicación.'
        }
    }
}

/* ---------- Coordenadas ---------- */

async function getCoordinates() {
    try {
        clearError()
        const position = await getCurrentPosition()
        document.getElementById('latitude-value').innerText = position.coords.latitude
        document.getElementById('longitude-value').innerText = position.coords.longitude
        document.getElementById('coordinates-table').classList.remove('is-hidden')
    } catch (error) {
        showError(`No se pudo obtener la ubicación: ${error.message}`)
    }
}

/* ---------- Municipio ---------- */

async function getMunicipality() {
    try {
        clearError()
        const position = await getCurrentPosition()
        const { latitude, longitude } = position.coords
        const response = await fetchJson(`${API_BASE}/ubicacion?lat=${latitude}&lon=${longitude}`)
        const location = response.ubicacion

        if (location.departamento?.nombre || location.municipio?.nombre || location.provincia?.nombre) {
            const provinceName = escapeHtml(location.provincia.nombre ?? '—')
            const departmentName = escapeHtml(location.departamento.nombre ?? '—')
            const municipalityName = escapeHtml(location.municipio.nombre ?? '—')

            document.getElementById('municipality-table-body').innerHTML = `
                <tr>
                    <td>${provinceName}</td>
                    <td>${departmentName}</td>
                    <td>${municipalityName}</td>
                </tr>`
            document.getElementById('municipality-table').classList.remove('is-hidden')
        } else {
            showError('Municipio no encontrado')
        }
    } catch (error) {
        showError(`No se pudo consultar la ubicación: ${error.message}`)
    }
}

/* ---------- Provincias ---------- */

async function loadProvinces() {
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

/* ---------- Listados genéricos (localidades / municipios) ---------- */

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
 * la lógica que antes estaba duplicada.
 */
async function loadList({ selectId, endpoint, containerId }) {
    const selectEl = document.getElementById(selectId)
    const province = selectEl.value
    const containerEl = document.getElementById(containerId)

    if (province === '-1') {
        containerEl.innerHTML = ''
        containerEl.setAttribute('aria-busy', 'false')
        return
    }

    const cacheKey = `${endpoint}:${province}`

    // Cancela una consulta anterior para este mismo select, si sigue en curso.
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

/* ---------- Inicialización ---------- */

function initialize() {
    document.getElementById('coordinates-table').classList.add('is-hidden')
    document.getElementById('municipality-table').classList.add('is-hidden')

    document.getElementById('permission-button').addEventListener('click', requestLocationPermission)
    document.getElementById('coordinates-button').addEventListener('click', getCoordinates)
    document.getElementById('municipality-button').addEventListener('click', getMunicipality)

    document.getElementById('localities-province-select').addEventListener('change', () =>
        loadList({ selectId: 'localities-province-select', endpoint: 'localidades', containerId: 'localities-result' })
    )
    document.getElementById('municipalities-province-select').addEventListener('change', () =>
        loadList({ selectId: 'municipalities-province-select', endpoint: 'municipios', containerId: 'municipalities-result' })
    )

    void loadProvinces()
}

document.addEventListener('DOMContentLoaded', initialize)