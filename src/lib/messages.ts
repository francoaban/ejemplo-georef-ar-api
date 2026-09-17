export type { MessagesShape } from '../locales/es.js'
import { es } from '../locales/es.js'

/**
 * Shim de compatibilidad — Fase 1 de i18n.
 *
 * Todos los componentes siguen importando `messages` desde acá (no
 * cambió ni un import en el resto del código). Lo que sí cambió es de
 * dónde viene: antes este archivo definía el objeto directamente;
 * ahora es un simple re-export de `locales/es.ts`, que es la fuente de
 * verdad de la FORMA de los mensajes (`MessagesShape`) contra la que
 * se valida cualquier otro locale (ver `locales/en.ts`).
 *
 * `messages` sigue apuntando a español, fijo — todavía no hay selector
 * de idioma. Ese es el trabajo de la Fase 2: reemplazar este re-export
 * estático por un hook (`useMessages()`) que elija entre `es`/`en`
 * según el locale activo. La forma de los datos no va a cambiar en ese
 * momento — los componentes ya consumen `messages.seccion.clave`, no
 * strings literales, así que ese cambio queda contenido a este único
 * archivo.
 */
export const messages = es
