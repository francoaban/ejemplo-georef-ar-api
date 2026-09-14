import { API_BASE, fetchJson, getCurrentPosition } from './api.js'
import { escapeHtml } from './dom-utils.js'
import { showError, clearError } from './status.js'

export async function requestLocationPermission({ onGranted } = {}) {
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
        onGranted?.()
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

export async function getCoordinates() {
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

export async function getMunicipality() {
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