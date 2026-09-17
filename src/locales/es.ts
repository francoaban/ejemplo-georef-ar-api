/**
 * Español — locale por defecto de la app, y fuente de verdad de la
 * FORMA de `messages`. Todo locale nuevo se valida contra el tipo
 * inferido de este archivo (`MessagesShape`), no al revés: agregar,
 * quitar o renombrar una clave acá es lo único que cambia el contrato
 * que los demás locales tienen que cumplir.
 */
export const es = {
    header: {
        eyebrow: 'Georreferenciación Argentina',
        title: 'Mi ubicación',
        description:
            'Consultá tus coordenadas, tu municipio y explorá el listado de localidades del país usando la API de datos.gob.ar.'
    },
    permission: {
        title: 'Permiso de ubicación',
        text: 'Para identificar dónde estás, necesitamos que autorices el acceso a la ubicación de tu dispositivo.',
        buttonDefault: 'Permitir acceso a mi ubicación',
        buttonGranted: 'Permiso concedido',
        buttonRetry: 'Reintentar',
        unsupported: 'La geolocalización no está disponible en este navegador.',
        requesting: 'Esperando autorización del navegador...',
        granted: 'Permiso concedido. Ya puedes consultar tu ubicación.',
        denied: 'Permiso denegado. Podés reintentar o habilitarlo desde la configuración del navegador.',
        error: 'No se pudo obtener el permiso de ubicación.'
    },
    coordinates: {
        title: 'Coordenadas actuales',
        buttonDefault: 'Obtener mis coordenadas',
        buttonLoading: 'Obteniendo…',
        latitud: 'Latitud',
        longitud: 'Longitud',
        caption: 'Latitud y longitud de tu ubicación',
        error: (mensaje: string) => `No se pudo obtener la ubicación: ${mensaje}`
    },
    municipality: {
        title: 'Municipio en el que me encuentro',
        buttonDefault: 'Detectar mi municipio',
        buttonLoading: 'Detectando…',
        provincia: 'Provincia',
        departamento: 'Departamento',
        municipio: 'Municipio',
        caption: 'Provincia, departamento y municipio detectados',
        notFound: 'Municipio no encontrado',
        error: (mensaje: string) => `No se pudo consultar la ubicación: ${mensaje}`
    },
    provinceList: {
        localitiesTitle: 'Listar localidades',
        municipalitiesTitle: 'Listar municipios',
        provinciaLabel: 'Provincia',
        loadingProvincias: 'Cargando listado de provincias…',
        selectPlaceholder: 'Seleccione una provincia',
        loading: 'Cargando…',
        error: (mensaje: string) => `No se pudo cargar el listado: ${mensaje}`
    },
    provinces: {
        error: (mensaje: string) => `No se pudieron cargar las provincias: ${mensaje}`
    },
    errorBoundary: {
        title: 'Algo salió mal',
        text: 'Ocurrió un error inesperado. Probá recargar la página; si el problema persiste, la API externa podría estar teniendo inconvenientes.'
    }
}

/**
 * El "contrato" que cualquier otro locale debe cumplir: mismas claves,
 * mismos tipos de valor (string vs función) en cada una. `en.ts` se
 * valida contra este tipo con `satisfies`, no con una anotación de
 * tipo — ver el comentario en `en.ts` para por qué esa diferencia
 * importa.
 */
export type MessagesShape = typeof es
