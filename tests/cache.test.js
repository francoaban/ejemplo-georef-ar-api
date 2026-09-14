import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getFromCache, saveToCache } from '../js/cache.js'

beforeEach(() => {
    sessionStorage.clear()
})

describe('cache: getFromCache', () => {
    it('devuelve null cuando la clave no existe', () => {
        expect(getFromCache('inexistente')).toBeNull()
    })

    it('devuelve el valor previamente guardado', () => {
        saveToCache('provinces', [{ id: '1', nombre: 'Jujuy' }])
        expect(getFromCache('provinces')).toEqual([{ id: '1', nombre: 'Jujuy' }])
    })

    it('devuelve null y no lanza error si el JSON guardado está corrupto', () => {
        sessionStorage.setItem('georef_cache_roto', '{esto no es json valido')
        expect(getFromCache('roto')).toBeNull()
    })
})

describe('cache: saveToCache', () => {
    it('guarda el valor bajo un prefijo propio para no colisionar con otras claves', () => {
        saveToCache('localidades:6', ['Perico', 'Palpalá'])
        expect(sessionStorage.getItem('georef_cache_localidades:6')).toBe(
            JSON.stringify(['Perico', 'Palpalá'])
        )
    })

    it('no lanza error si sessionStorage.setItem falla (ej. cuota excedida)', () => {
        const originalSetItem = Storage.prototype.setItem
        Storage.prototype.setItem = () => {
            throw new Error('QuotaExceededError')
        }

        expect(() => saveToCache('x', { a: 1 })).not.toThrow()

        Storage.prototype.setItem = originalSetItem
    })
})

describe('cache: comportamiento de sesión', () => {
    afterEach(() => {
        sessionStorage.clear()
    })

    it('el valor sigue disponible mientras no se limpie sessionStorage (dura la sesión)', () => {
        saveToCache('municipios:6', [{ nombre: 'San Salvador de Jujuy' }])
        expect(getFromCache('municipios:6')).not.toBeNull()
        expect(getFromCache('municipios:6')).not.toBeNull() // se puede leer más de una vez
    })

    it('desaparece si se limpia sessionStorage (simulando cierre de pestaña)', () => {
        saveToCache('provincias', [{ nombre: 'Salta' }])
        sessionStorage.clear()
        expect(getFromCache('provincias')).toBeNull()
    })
})
