import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../js/dom-utils.js'

describe('escapeHtml', () => {
    it('escapa etiquetas HTML para evitar inyección de scripts', () => {
        expect(escapeHtml('<script>alert(1)</script>')).toBe(
            '&lt;script&gt;alert(1)&lt;/script&gt;'
        )
    })

    it('escapa ampersands', () => {
        expect(escapeHtml('Ciudad & Provincia')).toBe('Ciudad &amp; Provincia')
    })

    it('deja el texto plano sin modificar', () => {
        expect(escapeHtml('San Salvador de Jujuy')).toBe('San Salvador de Jujuy')
    })

    it('devuelve cadena vacía para null', () => {
        expect(escapeHtml(null)).toBe('')
    })

    it('devuelve cadena vacía para undefined', () => {
        expect(escapeHtml(undefined)).toBe('')
    })

    it('al insertarse en el DOM no genera una etiqueta <img> ejecutable, aunque el texto crudo quede visible', () => {
        const nombreMalicioso = '"><img src=x onerror=alert(1)>'
        const escapado = escapeHtml(nombreMalicioso)

        const contenedor = document.createElement('div')
        contenedor.innerHTML = `<li>${escapado}</li>`

        expect(contenedor.querySelector('img')).toBeNull()
        expect(escapado).not.toContain('<img')
    })
})
