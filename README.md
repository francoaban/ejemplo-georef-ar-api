# Mi Ubicación (React + TypeScript)

Aplicación web que permite consultar la ubicación geográfica del usuario (coordenadas, provincia, departamento y municipio) y explorar el listado oficial de localidades y municipios de Argentina, usando la API pública de georreferenciación de datos.gob.ar.

Reescrita en **React + TypeScript + Vite** a partir de una versión previa en HTML/CSS/JS vanilla. Cada migración fue una oportunidad para corregir deuda real, no solo trasladar sintaxis — ver [Historial](#historial-del-proyecto).

---

## Tabla de contenidos

- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnología utilizada](#tecnología-utilizada)
- [Arquitectura y gestión de estado](#arquitectura-y-gestión-de-estado)
- [Tipado y validación de datos](#tipado-y-validación-de-datos)
- [API de consulta](#api-de-consulta)
- [Caché](#caché)
- [Seguridad](#seguridad)
- [Accesibilidad](#accesibilidad)
- [Telemetría](#telemetría)
- [Internacionalización (i18n)](#internacionalización-i18n)
- [Tests automatizados](#tests-automatizados)
- [Calidad de código (lint, tipos y formato)](#calidad-de-código-lint-tipos-y-formato)
- [Integración continua](#integración-continua)
- [Desarrollo local](#desarrollo-local)
- [Build y despliegue](#build-y-despliegue)
- [Historial del proyecto](#historial-del-proyecto)
- [Deuda técnica conocida](#deuda-técnica-conocida)

---

## Estructura del proyecto

```
mi-ubicacion-react/
├── index.html                    # Entry point de Vite
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts                # Config de Vite + Vitest
├── .oxlintrc.json                # Reglas de oxlint (incluye jsx-a11y)
├── .prettierrc.json              # Formato de código
├── .github/workflows/ci.yml      # CI: formato + lint + typecheck + tests + build
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                   # Monta <App/> envuelto en ErrorBoundary
    ├── App.tsx                    # Orquesta el flujo permiso → contenido
    ├── index.css                  # Tema Tailwind y estilos base globales
    ├── vite-env.d.ts
    ├── lib/
    │   ├── api.ts                  # fetch con reintentos + Geolocation API
    │   ├── cache.ts                 # Caché de sesión (sessionStorage)
    │   ├── schemas.ts                # Esquemas zod de las respuestas de la API
    │   ├── messages.ts                # Shim: reexporta locales/es.ts (sin selector todavía)
    │   ├── telemetry.ts                # Punto único de reporte de errores
    │   └── sortByName.ts               # Orden alfabético compartido (collation es)
    ├── locales/
    │   ├── es.ts                   # Locale español — fuente de verdad de MessagesShape
    │   └── en.ts                   # Locale inglés — validado con `satisfies MessagesShape`
    ├── hooks/
    │   ├── useGeolocationPermission.ts   # Máquina de estados del permiso
    │   ├── useCoordinates.ts              # Coordenadas actuales
    │   ├── useMunicipality.ts             # Provincia/depto/municipio actual
    │   ├── useCachedResource.ts           # Fetch + caché + cancelación (compartido)
    │   ├── useProvinces.ts                # Listado de provincias (envoltorio)
    │   └── useProvinceList.ts             # Listado de localidades/municipios (envoltorio)
    ├── components/
    │   ├── Header.tsx
    │   ├── PermissionCard.tsx
    │   ├── CoordinatesCard.tsx
    │   ├── MunicipalityCard.tsx
    │   ├── ProvinceListCard.tsx    # Una sola implementación para ambos listados
    │   ├── ErrorMessage.tsx        # Mensaje de error inline, por tarjeta
    │   ├── ErrorBoundary.tsx       # Red de seguridad ante errores de render
    │   └── Spinner.tsx
    └── tests/
        ├── setup.ts                          # Silencia console.error esperado en toda la suite
        ├── App.test.tsx                        # Integración: flujo completo
        ├── ProvinceListCard.test.tsx
        ├── PermissionCard.test.tsx
        ├── ErrorBoundary.test.tsx
        ├── useGeolocationPermission.test.ts
        ├── useCoordinates.test.ts
        ├── useMunicipality.test.ts
        ├── useProvinces.test.ts
        ├── useProvinceList.test.ts
        ├── useCachedResource.test.ts
        ├── schemas.test.ts
        ├── locales.test.ts
        ├── telemetry.test.ts
        ├── api.test.ts
        └── cache.test.ts
```

### Responsabilidad de cada capa

| Capa          | Responsabilidad                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/`        | Acceso a red, almacenamiento, validación de datos, strings y telemetría. Sin JSX, sin conocimiento de React — reusable en cualquier otro contexto (Node, otra UI).                                                                |
| `hooks/`      | Un hook por feature. Cada uno encapsula su propio estado (`data`, `loading`, `error`) y expone una API mínima al componente. No conocen el DOM.                                                                                   |
| `components/` | Solo presentación. Reciben datos y callbacks de los hooks, renderizan JSX. `ProvinceListCard` es genérico y parametrizado (`endpoint`, `title`) — reemplaza el par de secciones casi idénticas que existía en la versión vanilla. |
| `App.tsx`     | Único componente que conoce la composición completa de la página y decide qué se muestra según el estado del permiso.                                                                                                             |

---

## Tecnología utilizada

- **React 19** con hooks (sin clases, salvo `ErrorBoundary`, que todavía lo requiere).
- **TypeScript** en modo `strict`, con `noUnusedLocals` y `noUnusedParameters`. `pnpm build` corre `tsc -b` antes de `vite build` — un error de tipos rompe el build, no es solo una advertencia del editor.
- **zod** para validar en runtime la forma de las respuestas de la API externa, con los tipos de TypeScript inferidos del esquema (`z.infer`).
- **Vite 8** como build tool y dev server — usa el nuevo pipeline `oxc` para transformar y bundlear.
- **Tailwind CSS 4** integrado mediante el plugin oficial de Vite; los componentes usan sus utilidades para layout, estados y responsive.
- **Vitest + jsdom** para tests unitarios y de integración.
- **@testing-library/react** + **@testing-library/user-event** — tests que simulan interacción real del usuario, no implementación interna de los componentes.
- **oxlint** — linter basado en Rust, con los plugins `react` (`rules-of-hooks`, detección de `setState` dentro de efectos) y `jsx-a11y` (accesibilidad) habilitados.
- **Prettier** — formato de código automático.
- **@fontsource** — Space Grotesk e Inter autoalojadas (sin depender de la CDN de Google Fonts).
- **GitHub Actions** — CI que corre formato, lint, typecheck, tests y build en cada push/PR.

No hay backend propio: toda la lógica corre en el navegador del usuario.

---

## Arquitectura y gestión de estado

A diferencia de la versión vanilla —donde el estado vivía disperso en clases CSS y en el contenido del DOM (`classList.contains('is-hidden')`, `select.value`, `innerHTML` como fuente de verdad)—, acá el estado es explícito y vive en `useState` de React:

- **`useGeolocationPermission`** modela el permiso como una máquina de estados explícita (`idle | requesting | granted | denied | unsupported | error`), no como una combinación de `disabled`, clases CSS y texto libre. `denied` y `error` reciben el mismo tratamiento de "Reintentar" — para el usuario son el mismo caso: algo no funcionó y puede volver a intentar.
- **`useCachedResource`** es la única implementación de fetch+caché+cancelación+protección de carrera del proyecto. `useProvinces` y `useProvinceList` son envoltorios finos sobre este hook — antes cada uno reimplementaba esa lógica por su lado, con variaciones sutiles que generaban 2 warnings de lint distintos; ahora hay 1 solo, centralizado y documentado.
- **Cancelación real**: el `useEffect` de `useCachedResource` cancela la petición en curso tanto si cambia `cacheKey` como si el componente se desmonta — la versión vanilla nunca manejaba el segundo caso.
- **Sin manipulación manual del DOM**: no hay un solo `document.getElementById` en toda la capa de componentes. React decide qué renderizar a partir del estado.
- **Sin `escapeHtml()` manual**: React escapa automáticamente todo lo que se interpola con `{}` en JSX — esa clase entera de bugs desaparece por diseño, no por disciplina del desarrollador.

---

## Tipado y validación de datos

Dos capas distintas, cada una resolviendo un problema distinto:

- **TypeScript (compile-time)**: los props de cada componente, el retorno de cada hook y las firmas de `lib/` tienen tipos explícitos. Un typo en un nombre de prop, o pasar un `string` donde se espera un `Coordinates`, rompe el build antes de llegar a producción.
- **zod (runtime)**: TypeScript no puede validar la forma de una respuesta HTTP — eso solo se sabe en tiempo de ejecución. `src/lib/schemas.ts` define esquemas `zod` para las tres respuestas de la API Georef; el tipo de cada una se infiere del esquema (`z.infer<typeof schema>`), así que el tipo y la validación no pueden desincronizarse con el tiempo. Si la API externa cambia su forma, la app falla con un mensaje claro en el momento del fetch, no con un `Cannot read properties of undefined` críptico en medio de un render.

`fetchJson()` (`lib/api.ts`) devuelve `unknown` a propósito — no sabe ni debería saber qué forma tiene la respuesta. Cada hook pasa ese `unknown` por el parser de `schemas.ts` correspondiente antes de tocarlo.

---

## API de consulta

Se utiliza la **API de Georreferenciación (Georef)** de datos.gob.ar, pública y sin API key.

**Base URL:** `https://apis.datos.gob.ar/georef/api`

| Endpoint       | Parámetros                              | Hook que lo consume              | Esquema zod                    |
| -------------- | --------------------------------------- | -------------------------------- | ------------------------------ |
| `/provincias`  | `campos=nombre&max=30`                  | `useProvinces`                   | `provinciasResponseSchema`     |
| `/ubicacion`   | `lat`, `lon`                            | `useMunicipality`                | `ubicacionResponseSchema`      |
| `/localidades` | `provincia={id}&campos=nombre&max=1000` | `useProvinceList('localidades')` | esquema de `parseListResponse` |
| `/municipios`  | `provincia={id}&campos=nombre&max=1000` | `useProvinceList('municipios')`  | esquema de `parseListResponse` |

Documentación oficial: [https://datosgobar.github.io/georef-ar-api/](https://datosgobar.github.io/georef-ar-api/)

Todas las llamadas pasan por `fetchJson()`, que reintenta hasta 2 veces con backoff exponencial (500ms, 1s) ante fallos de red o respuestas no-OK, sin reintentar si la petición fue cancelada intencionalmente (`AbortError`).

---

## Caché

`useProvinces` y `useProvinceList` (vía `useCachedResource`) cachean en `sessionStorage` (`src/lib/cache.ts`), sin librerías externas. La caché dura únicamente la sesión del navegador — se borra sola al cerrar la pestaña, sin vencimiento propio dentro de la sesión. Si `sessionStorage` no está disponible (modo privado, cuota excedida), la app degrada de forma segura: simplemente no cachea.

---

## Seguridad

- **CSP estricta** declarada en `index.html`: `script-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `connect-src` limitado a la API de datos.gob.ar. Sin `'unsafe-inline'` en ninguna directiva, y **sin excepciones para dominios de terceros** — al autoalojar las fuentes con `@fontsource`, no hace falta permitir `fonts.googleapis.com`/`fonts.gstatic.com`.
- **Sin XSS por diseño**: al no usarse `dangerouslySetInnerHTML` en ningún componente, no existe superficie de ataque de inyección de HTML — React escapa todo el contenido dinámico automáticamente.
- **Validación de las respuestas de la API** (`zod`, ver arriba): reduce la superficie de fallos inesperados si el servicio externo cambia su contrato.
- **`ErrorBoundary`**: si algo lanza un error inesperado durante el render, la app muestra un mensaje de recuperación en vez de una pantalla en blanco, y lo reporta vía `reportError` (ver [Telemetría](#telemetría)).

---

## Accesibilidad

- Cada tarjeta usa `aria-labelledby` apuntando a su propio `<h2>`.
- `useGeolocationPermission` expone su mensaje de estado en un `<output aria-live="polite">` — se prefirió el elemento semántico `output` (que ya tiene un rol implícito de `status`) sobre un `<p role="status">`, señalado por el linter de accesibilidad.
- `ErrorMessage` usa `role="alert"` — los lectores de pantalla anuncian el error inmediatamente, sin que el usuario tenga que ir a buscarlo.
- **Gestión de foco**: al conceder el permiso y revelarse el resto del contenido, el foco se mueve programáticamente al primer encabezado revelado (`CoordinatesCard`). Sin esto, el foco quedaría huérfano en un botón que ya no existe en el DOM.
- `aria-busy` en los listados mientras cargan, con spinner visual (`prefers-reduced-motion` respetado).
- Sin `alert()` nativo del navegador: la confirmación del permiso se comunica solo por el `aria-live`, evitando un diálogo bloqueante e inconsistente entre navegadores y lectores de pantalla.
- **`jsx-a11y` habilitado en oxlint** (ver [Calidad de código](#calidad-de-código-lint-tipos-y-formato)): atrapa automáticamente regresiones de accesibilidad, no depende solo de la revisión manual.

---

## Telemetría

`src/lib/telemetry.ts` es el único punto por el que pasa cualquier error que la UI no puede resolver por sí sola. Hoy solo hace `console.error`, pero la razón de que exista como función propia (en vez de llamar a `console.error` directo desde cada `catch`) es la superficie de cambio: conectar un servicio real (Sentry o similar) es editar un solo archivo, no rastrear el código entero.

Puntos conectados:

- `ErrorBoundary.componentDidCatch` — errores de render.
- `useCachedResource` — fallos de red al cargar provincias/localidades/municipios (no se reportan los `AbortError`, que son cancelaciones intencionales, no fallos).
- `useCoordinates` y `useMunicipality` — fallos al obtener coordenadas o resolver la ubicación.
- `window.addEventListener('unhandledrejection', …)` en `main.tsx` — red de seguridad final para cualquier rechazo de promesa que se haya escapado de un `try/catch` propio.

---

## Internacionalización (i18n)

**Fase 1 — hecha.** La app tiene dos locales completos: `src/locales/es.ts` (español, fuente de verdad) y `src/locales/en.ts` (inglés). Ningún componente conoce un string literal — todos consumen `messages.sección.clave`, así que agregar un locale nuevo no toca los 8 componentes, solo agrega un archivo.

### Por qué esto no se resolvió con `zod`

`zod` valida datos externos en runtime — es la herramienta correcta para las respuestas de la API (`lib/schemas.ts`), porque esos datos llegan de afuera y no se puede confiar en su forma hasta verla. Los mensajes de traducción son distintos: son un objeto estático, escrito en el propio código, conocido en compile-time. Para garantizar que `en.ts` tenga exactamente las mismas claves que `es.ts` (ni de más, ni de menos, con el mismo tipo de valor en cada una), la herramienta correcta es el sistema de tipos de TypeScript, no una librería de validación en runtime — es gratis en tiempo de ejecución y el error aparece en el editor, no en producción.

### Cómo se garantiza la paridad entre locales

```ts
// locales/es.ts — fuente de verdad de la FORMA
export const es = {
    coordinates: {
        error: (mensaje: string) => `No se pudo obtener la ubicación: ${mensaje}`
    }
    // ...
}
export type MessagesShape = typeof es

// locales/en.ts — validado estructuralmente contra es.ts
export const en = {
    coordinates: {
        error: (message: string) => `Could not get your location: ${message}`
    }
    // ...
} satisfies MessagesShape
```

`satisfies MessagesShape` (no `: MessagesShape`) es la pieza clave: chequea que `en` tenga cada clave de `es`, con el mismo tipo de valor en cada una (`string` vs función), sin ensanchar los tipos de `en` a `string` genérico ni permitir claves de más. Borrar una clave en `en.ts`, o convertir un `(msg: string) => string` en un string plano, hace fallar `pnpm typecheck` — antes de llegar a CI, no como un string faltante que alguien nota en producción.

**Un bug real que este mismo mecanismo atrapó durante el desarrollo**: la primera versión de `es.ts` tenía `as const` al final del objeto. Eso convierte cada string en su tipo literal exacto (`"Mi ubicación"` en vez de `string`), así que `MessagesShape` terminaba pidiendo que `en.ts` tuviera el string `"Mi ubicación"` en esa clave — literalmente imposible de traducir. `pnpm typecheck` lo rechazó con más de 30 errores en el primer intento. La corrección fue quitar el `as const`: la fuente de verdad necesita describir la _forma_ (`string`, o función `string → string`), no el _valor_ exacto.

### Test de paridad en runtime (defensa en profundidad)

`satisfies` ya lo garantiza en compile-time, pero `src/tests/locales.test.ts` lo vuelve a chequear en runtime — por si algún día se corre `vitest` sin haber corrido `tsc` antes (un watch mode suelto, por ejemplo), sin depender de que el typecheck se haya ejecutado.

### Lo que falta — Fase 2

- **Selector de locale**: `lib/messages.ts` hoy es un shim que reexporta `locales/es.ts` sin condición — sigue siendo español fijo. Falta un hook (`useMessages()` o similar) que elija entre `es`/`en` según el idioma activo (selector manual, `navigator.language`, o una ruta `/en`).
- **`<title>` y `<meta name="description">` de `index.html`**: viven fuera del árbol de React, en HTML estático — `messages.ts` no los cubre. El día que se implemente el selector, hace falta setearlos a mano vía `document.title` en un efecto (o resolverlo en build-time si en algún momento se migra a SSG).

---

## Tests automatizados

**69 tests** con Vitest + React Testing Library, en dos niveles:

- **Unitarios** (`lib/`, hooks individuales): prueban cada pieza en aislamiento, mockeando sus dependencias.
- **De integración** (`App.test.tsx`): montan la aplicación completa y verifican el flujo real del usuario. Incluye el test que la versión vanilla nunca tuvo — reproduce el bug de arquitectura original (un error que ocurre _después_ de conceder el permiso) y verifica que sea visible, no que quede huérfano en una sección oculta.

Algunos tests documentan explícitamente una regresión real detectada durante el desarrollo, no solo el comportamiento esperado — por ejemplo, `useCachedResource.test.ts` tiene un test dedicado a que `loading` vuelva a `false` tras un `AbortError`, porque un diseño intermedio del hook lo dejaba trabado en `true` para siempre en ese caso.

```bash
pnpm test              # corre toda la suite una vez
pnpm test:watch        # modo watch
pnpm test:coverage     # reporte de cobertura (v8)
```

---

## Calidad de código (lint, tipos y formato)

```bash
pnpm typecheck         # tsc -b — sin emitir archivos, solo valida tipos
pnpm lint              # oxlint — reglas de React + jsx-a11y
pnpm format            # Prettier, aplica el formato
pnpm format:check      # Prettier, solo verifica (usado en CI)
```

`oxlint` señala hoy **1 warning** (no error), centralizado en `useCachedResource.ts` y documentado inline en el propio código — ver [Deuda técnica conocida](#deuda-técnica-conocida).

---

## Integración continua

`.github/workflows/ci.yml` corre en cada push/PR a `main`: instala dependencias con `pnpm --frozen-lockfile`, valida formato, lint, **typecheck**, tests y build de producción, en ese orden. Un PR no debería poder mergearse si alguno de esos pasos falla.

---

## Desarrollo local

```bash
pnpm install
pnpm dev        # servidor de desarrollo con HMR
pnpm build      # tsc -b && vite build → dist/
pnpm preview    # sirve el build de dist/ localmente
```

> El proyecto declara `"packageManager": "pnpm@9.12.3"` (Corepack). Si no tenés `pnpm`: `corepack enable` o `npm install -g pnpm`.

---

## Build y despliegue

`pnpm build` genera un `dist/` completamente estático (HTML + JS + CSS + fuentes, todo con hashes de contenido), desplegable en cualquier hosting estático:

- **Netlify / Vercel**: build command `pnpm build`, publish directory `dist`.
- **GitHub Pages**: requiere configurar `base` en `vite.config.ts` si el sitio no se sirve desde la raíz del dominio.
- **Cualquier hosting tradicional**: subir el contenido de `dist/` a la raíz o a un subdirectorio.

Como la Geolocation API requiere un contexto seguro, el sitio debe servirse bajo **HTTPS** (u opcionalmente `http://localhost` en desarrollo). Netlify, Vercel y GitHub Pages proveen HTTPS automático.

---

## Historial del proyecto

**Vanilla → React.** La versión original (HTML/CSS/JS con ES Modules nativos, sin build step) tenía un bug de arquitectura real: los mensajes de error se escribían todos en un único `<p id="permission-status">`, dentro de la sección de permiso — que se ocultaba apenas el usuario concedía el permiso. Cualquier error posterior (la mayoría, en uso real) se escribía en un elemento invisible. La migración a React lo resolvió **estructuralmente**: cada tarjeta renderiza su propio `<ErrorMessage>` inline, así que es arquitectónicamente imposible que un error quede huérfano en una sección invisible.

**JavaScript → TypeScript**, agregando en el camino: esquemas `zod` (reemplazando guards manuales), `messages.ts` (centralizando strings, base de i18n), fuentes autoalojadas con `@fontsource` (CSP más estricta), el plugin `jsx-a11y` de `oxlint` (encontró y corrigió un caso real: `<p role="status">` → `<output>`), y un módulo de telemetría conectado en los cuatro puntos donde antes había `console.error` sueltos o directamente ningún reporte.

En el camino se corrigieron, además, varios problemas puntuales encontrados en revisión: `window.alert()` bloqueante y redundante (eliminado), estado obsoleto tras un reintento fallido en `useCoordinates`/`useMunicipality` (corregido), ausencia de `ErrorBoundary` y de gestión de foco (agregados), inconsistencia entre los estados `denied`/`error` en `PermissionCard` (unificados), y dos títulos de `ProvinceListCard` que habían quedado hardcodeados en `App.tsx` pese a existir `messages.ts` específicamente para evitar eso.

---

## Deuda técnica conocida

Lo que queda pendiente, a propósito documentado en vez de omitido:

- **i18n — Fase 2 (selector de idioma) pendiente**: existen `locales/es.ts` y `locales/en.ts`, validados estructuralmente entre sí, pero no hay todavía un selector de idioma ni una forma de que el usuario elija — `lib/messages.ts` sigue apuntando a español fijo. Ver la sección [Internacionalización (i18n)](#internacionalización-i18n) para el detalle de qué está resuelto y qué falta.
- **`zod` valida forma, no reemplaza documentación de contrato versionada**: cubre bien las 3 respuestas conocidas y estables de la API Georef. Si la API creciera mucho, convendría generar los esquemas desde una especificación OpenAPI en vez de mantenerlos a mano.
- **Sin telemetría real conectada a un servicio externo**: `reportError` está listo para conectarse a Sentry o similar, pero hoy solo hace `console.error` — no hay dashboards ni alertas en un entorno real.
