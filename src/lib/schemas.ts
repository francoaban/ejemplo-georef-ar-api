import { z } from 'zod'

const namedItemSchema = z.object({
    nombre: z.string()
})
export type NamedItem = z.infer<typeof namedItemSchema>

const provinciaSchema = z.object({
    id: z.string(),
    nombre: z.string()
})
export type Provincia = z.infer<typeof provinciaSchema>

const provinciasResponseSchema = z.object({
    provincias: z.array(provinciaSchema)
})

const ubicacionCampoSchema = z.object({
    nombre: z.string().optional()
})

const ubicacionResponseSchema = z.object({
    ubicacion: z.object({
        provincia: ubicacionCampoSchema,
        departamento: ubicacionCampoSchema,
        municipio: ubicacionCampoSchema
    })
})
export type UbicacionCampo = z.infer<typeof ubicacionCampoSchema>

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, contexto: string): T {
    const resultado = schema.safeParse(data)
    if (!resultado.success) {
        throw new Error(`La API de ${contexto} devolvió una respuesta con un formato inesperado.`)
    }
    return resultado.data
}

export function parseProvinciasResponse(data: unknown): Provincia[] {
    return parseOrThrow(provinciasResponseSchema, data, 'provincias').provincias
}

export function parseListResponse(
    data: unknown,
    endpoint: 'localidades' | 'municipios'
): NamedItem[] {
    if (endpoint === 'localidades') {
        return parseOrThrow(z.object({ localidades: z.array(namedItemSchema) }), data, endpoint)
            .localidades
    }
    return parseOrThrow(z.object({ municipios: z.array(namedItemSchema) }), data, endpoint)
        .municipios
}

export function parseUbicacionResponse(data: unknown) {
    return parseOrThrow(ubicacionResponseSchema, data, 'ubicación').ubicacion
}
