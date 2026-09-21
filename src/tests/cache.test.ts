import { describe, it, expect } from 'vitest'
import { getFromCache, saveToCache } from '../lib/cache.js'

describe('cache', () => {
    it('devuelve null cuando la clave no existe', () => {
        expect(getFromCache('inexistente')).toBeNull()
    })

    it('guarda y recupera un valor', () => {
        saveToCache('provinces', [{ id: '1', nombre: 'Jujuy' }])
        expect(getFromCache('provinces')).toEqual([{ id: '1', nombre: 'Jujuy' }])
    })

    it('usa un prefijo propio para no colisionar con otras claves', () => {
        saveToCache('localidades:6', ['Perico'])
        expect(sessionStorage.getItem('georef_cache_localidades:6')).toBe(
            JSON.stringify(['Perico'])
        )
    })

    it('devuelve null si el JSON guardado está corrupto', () => {
        sessionStorage.setItem('georef_cache_roto', '{no valido')
        expect(getFromCache('roto')).toBeNull()
    })

    it('no lanza error si sessionStorage.setItem falla', () => {
        const original = Storage.prototype.setItem
        Storage.prototype.setItem = () => {
            throw new Error('QuotaExceededError')
        }

        expect(() => saveToCache('x', 1)).not.toThrow()

        Storage.prototype.setItem = original
    })
})
