import { describe, it, expect } from 'vitest'
import {
    parseProvinciasResponse,
    parseListResponse,
    parseUbicacionResponse
} from '../lib/schemas.js'

describe('parseProvinciasResponse', () => {
    it('acepta una respuesta con la forma esperada', () => {
        const response = { provincias: [{ id: '1', nombre: 'Buenos Aires' }] }
        expect(parseProvinciasResponse(response)).toEqual(response.provincias)
    })

    it('rechaza una respuesta sin el array "provincias"', () => {
        expect(() => parseProvinciasResponse({})).toThrow('formato inesperado')
    })

    it('rechaza items sin "nombre"', () => {
        expect(() => parseProvinciasResponse({ provincias: [{ id: '1' }] })).toThrow(
            'formato inesperado'
        )
    })
})

describe('parseListResponse', () => {
    it('acepta una respuesta de localidades válida', () => {
        const response = { localidades: [{ nombre: 'Perico' }] }
        expect(parseListResponse(response, 'localidades')).toEqual(response.localidades)
    })

    it('rechaza si falta la clave del endpoint pedido', () => {
        expect(() => parseListResponse({ municipios: [] }, 'localidades')).toThrow(
            'formato inesperado'
        )
    })

    it('rechaza si algún item no tiene "nombre"', () => {
        expect(() => parseListResponse({ municipios: [{}] }, 'municipios')).toThrow(
            'formato inesperado'
        )
    })
})

describe('parseUbicacionResponse', () => {
    it('acepta una respuesta con los tres campos esperados', () => {
        const response = {
            ubicacion: { provincia: { nombre: 'Jujuy' }, departamento: {}, municipio: {} }
        }
        expect(parseUbicacionResponse(response)).toEqual(response.ubicacion)
    })

    it('rechaza si falta la clave "ubicacion"', () => {
        expect(() => parseUbicacionResponse({})).toThrow('formato inesperado')
    })

    it('rechaza si falta alguno de los tres campos', () => {
        expect(() =>
            parseUbicacionResponse({ ubicacion: { provincia: {}, departamento: {} } })
        ).toThrow('formato inesperado')
    })
})
