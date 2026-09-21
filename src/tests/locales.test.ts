import { describe, it, expect } from 'vitest'
import { es } from '../locales/es.js'
import { en } from '../locales/en.js'

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
})
