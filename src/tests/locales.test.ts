import { describe, it, expect } from 'vitest'
import { es } from '../locales/es.js'
import { en } from '../locales/en.js'
import { messages } from '../lib/messages.js'

/**
 * `satisfies MessagesShape` en `en.ts` ya impide compilar si falta una
 * clave o si el tipo de un valor no coincide (string vs función). Este
 * test es una segunda red, no redundante: cubre el escenario de correr
 * `vitest` sin haber corrido `tsc` antes (por ejemplo, un watch mode
 * suelto), donde un error de tipos no se habría notado todavía.
 */
function collectPaths(obj: unknown, prefix = ''): string[] {
    if (typeof obj !== 'object' || obj === null) return [prefix]
    return Object.entries(obj).flatMap(([key, value]) =>
        collectPaths(value, prefix ? `${prefix}.${key}` : key)
    )
}

describe('paridad de locales', () => {
    it('en.ts tiene exactamente las mismas claves que es.ts', () => {
        expect(collectPaths(en).sort()).toEqual(collectPaths(es).sort())
    })

    it('cada clave tiene el mismo tipo de valor (string vs función) en ambos locales', () => {
        const paths = collectPaths(es)
        for (const path of paths) {
            const getValue = (obj: object, p: string) =>
                p
                    .split('.')
                    .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], obj)

            const esType = typeof getValue(es, path)
            const enType = typeof getValue(en, path)
            expect(enType, `"${path}" difiere de tipo entre locales`).toBe(esType)
        }
    })

    it('las funciones de mensaje con placeholder devuelven un string que incluye el mensaje interpolado', () => {
        expect(es.coordinates.error('detalle')).toContain('detalle')
        expect(en.coordinates.error('detail')).toContain('detail')
    })

    it('el shim messages.ts sigue apuntando a español (todavía sin selector de idioma)', () => {
        expect(messages).toBe(es)
    })
})
