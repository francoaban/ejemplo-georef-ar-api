(
    /**
     * Obtiene un listado de las provincias y cumpleta las Select de Provincia
     */
    function () {
    
        fetch("https://apis.datos.gob.ar/georef/api/provincias?campos=nombre&max=30")
        .then(response => response.json())
        .then(response => {
            
            let provincias = response.provincias

            document.getElementById('selectProvincias').innerHTML = ''
            document.getElementById('selectProvincias1').innerHTML = ''

            let option = '<option value="-1">Seleccione una provincia</option>'
            
            for (let i = 0; i < provincias.length; i++) {
                option += `<option value="${provincias[i].id}">${provincias[i].nombre}</option>`
            }
            
            document.getElementById('selectProvincias').innerHTML = option
            document.getElementById('selectProvincias1').innerHTML = option
        })
        .catch(function (err) {
            console.log(err)
        })
    }
)()

/**
 * Oculta las tablas en las que se muestran los datos de ubicación
 */
function ocultarTablas() {
    //tabla en la que se muestran las latitud y longitud de la ubicación actual
    document.getElementById('geolocalizacion').style.display = 'none'
    //tabla en la que se muestra la provincia, departamento y municipio en la que se encuentra actualmente geoposicionado
    document.getElementById('municipio').style.display = 'none'
}

/**
 * Optiene las coordenadas de latitud y longitud de la ubicación actual
 */
function ubicacion() {
    navigator.geolocation.getCurrentPosition(function (position) {
        document.getElementById("latitud").innerText = position.coords.latitude
        document.getElementById("longitud").innerText = position.coords.longitude
        document.getElementById('geolocalizacion').style.display = 'table-cell'
    })
}

/**
 * Obtiene el nombre de la Provincia, Departamento y Municipio en el que se encuentra actualmente
 */
function municipio() {
    navigator.geolocation.getCurrentPosition(function (position) {
        let latitud = position.coords.latitude
        let longitud = position.coords.longitude

        fetch(`https://apis.datos.gob.ar/georef/api/ubicacion?lat=${latitud}&lon=${longitud}`)
        .then(response => response.json())
        .then(response => {
            if (response.ubicacion.departamento.nombre != null || response.ubicacion.municipio.nombre != null || response.ubicacion.provincia.nombre != null) {

                document.getElementById('miMunicipio').innerHTML = '<td>' + response.ubicacion.provincia.nombre + '</td>' +
                    '<td>' + response.ubicacion.departamento.nombre + '</td>' +
                    '<td>' + response.ubicacion.municipio.nombre + '</td>'

                document.getElementById('municipio').style.display = 'table-cell'
            } else {
                alert('Municipio no encontrado')
            }
        })
        .catch(function (err) {
            console.log(err)
        })
    })
}

/**
 * Obtiene un listado de las localidades correspondientes a la provincia seleccionada
 */
function listaDelocalidades() {
    let select = document.getElementById('selectProvincias').selectedIndex
    //optiene el valor del id correspondiente a la proviencia seleccionada
    let provincia = document.getElementById('selectProvincias')[select].value
    
    fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${provincia}&campos=nombre&max=1000`)
    .then(response => response.json())
    .then(response => {
        
        let localidades = response.localidades
        
        document.getElementById('localidades').innerHTML = ''
        
        let option = '<ol>'
        
        for (let i = 0; i < localidades.length; i++) {
            option += `<li>${localidades[i].nombre}</li>`
        }
        
        document.getElementById('localidades').innerHTML = option + '</ol>'
    })
    .catch(function (err) {
        console.log(err)
    })
}

/**
 * Obtiene un listado de los municipios correspondientes a la provincia seleccionada
 */

function listaDeMunicipios() {
    let select = document.getElementById('selectProvincias1').selectedIndex
    //optiene el valor del id correspondiente a la proviencia seleccionada
    let provincia = document.getElementById('selectProvincias1')[select].value
    
    fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${provincia}&campos=nombre&max=1000`)
    .then(response => response.json())
    .then(response => {
    
        let municipios = response.municipios
    
        document.getElementById('municipios').innerHTML = ''
    
        let option = '<ol>'
    
        for (let i = 0; i < municipios.length; i++) {
            option += `<li>${municipios[i].nombre}</li>`
        }
    
        document.getElementById('municipios').innerHTML = option + '</ol>'
    })
    .catch(function (err) {
        console.log(err)
    })
}
