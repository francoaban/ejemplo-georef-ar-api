import { requestLocationPermission, getCoordinates, getMunicipality } from './geolocation.js'
import { loadProvinces, loadList } from './lists.js'

const contentSectionIds = [
    'coordinates-section',
    'municipality-section',
    'localities-section',
    'municipalities-section'
]

/**
 * Oculta la sección de permiso y muestra el resto del contenido,
 * cargando recién ahí el listado de provincias.
 */
function revealMainContent() {
    document.getElementById('permission-section').classList.add('is-hidden')
    contentSectionIds.forEach(id => document.getElementById(id).classList.remove('is-hidden'))
    void loadProvinces()
}

function handlePermissionButtonClick() {
    requestLocationPermission({
        onGranted: () => {
            alert('Se obtuvo el permiso de ubicación.')
            revealMainContent()
        }
    })
}

function initialize() {
    document.getElementById('coordinates-table').classList.add('is-hidden')
    document.getElementById('municipality-table').classList.add('is-hidden')

    document.getElementById('permission-button').addEventListener('click', handlePermissionButtonClick)
    document.getElementById('coordinates-button').addEventListener('click', getCoordinates)
    document.getElementById('municipality-button').addEventListener('click', getMunicipality)

    document.getElementById('localities-province-select').addEventListener('change', () =>
        loadList({ selectId: 'localities-province-select', endpoint: 'localidades', containerId: 'localities-result' })
    )
    document.getElementById('municipalities-province-select').addEventListener('change', () =>
        loadList({ selectId: 'municipalities-province-select', endpoint: 'municipios', containerId: 'municipalities-result' })
    )
}

document.addEventListener('DOMContentLoaded', initialize)