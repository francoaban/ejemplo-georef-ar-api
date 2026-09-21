# Mi Ubicación (React + TypeScript)

Aplicación web que permite consultar la ubicación geográfica del usuario (coordenadas, provincia, departamento y municipio) y explorar el listado oficial de localidades y municipios de Argentina, usando la API pública de georreferenciación de datos.gob.ar.

Reescrita en **React + TypeScript + Vite + Tailwind CSS** a partir de una versión previa en HTML/CSS/JS vanilla. Cada migración fue una oportunidad para corregir deuda real, no solo trasladar sintaxis — ver [Historial](#historial-del-proyecto).

---

## Tabla de contenidos

- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnología utilizada](#tecnología-utilizada)
- [Estilos (Tailwind CSS)](#estilos-tailwind-css)
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
├── pnpm-lock.yaml                 # Lockfile único del proyecto (pnpm)
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts                # Config de Vite + Vitest
├── .oxlintrc.json                # Reglas de oxlint (incluye jsx-a11y)
├── .prettierrc.json              # Formato de código
├── .github/workflows/ci.yml      # CI: formato + lint + typecheck + tests + build
├── .vscode/
│   ├── launch.json                # Depuración de la app con Chrome
│   └── tasks.json                 # Tareas pnpm: install, test, build, dev y preview
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                   # Monta <App/> envuelto en ErrorBoundary
    ├── App.tsx                    # Orquesta el flujo permiso → contenido
    ├── index.css                  # `@theme` de Tailwind: paleta, tipografía, breakpoints
    ├── vite-env.d.ts
    ├── styles/
    │   └── variants.ts            # Composición de utilidades Tailwind (botones, tarjetas, tablas)
    ├── lib/
    │   ├── api.ts                  # fetch con reintentos + Geolocation API
    │   ├── cache.ts                 # Caché de sesión (sessionStorage)
    │   ├── schemas.ts                # Esquemas zod de las respuestas de la API
    │   ├── telemetry.ts               # Punto único de reporte de errores
    │   └── sortByName.ts              # Orden alfabético compartido (collation es)
    ├── locales/
    │   ├── es.ts                   # Locale español — fuente de verdad de MessagesShape
    │   └── en.ts                   # Locale inglés — validado con `satisfies MessagesShape`
    ├── i18n/
    │   ├── localeContext.ts        # LocaleContext + useLocale() (aparte, por Fast Refresh)
    │   └── LocaleProvider.tsx      # Detección, persistencia y sync de document.*
    ├── hooks/
    │   ├── useGeolocationPermission.ts   # Máquina de estados del permiso
    │   ├── useCoordinates.ts              # Coordenadas actuales
    │   ├── useMunicipality.ts             # Provincia/depto/municipio actual
    │   ├── useCachedResource.ts           # Fetch + caché + cancelación (compartido)
    │   ├── useProvinces.ts                # Listado de provincias (envoltorio)
    │   └── useProvinceList.ts             # Listado de localidades/municipios (envoltorio)
    ├── components/
    │   ├── Header.tsx
    │   ├── LocaleSwitcher.tsx      # Selector de idioma (es/en)
    │   ├── PermissionCard.tsx
    │   ├── CoordinatesCard.tsx
    │   ├── MunicipalityCard.tsx
    │   ├── ProvinceListCard.tsx    # Una sola implementación para ambos listados
    │   ├── ErrorMessage.tsx        # Mensaje de error inline, por tarjeta
    │   ├── ErrorBoundary.tsx       # Red de seguridad ante errores de render
    │   └── Spinner.tsx
    └── tests/
        ├── setup.ts                          # Silencia console.error esperado en toda la suite
        ├── test-utils.tsx                     # render/renderHook envueltos en <LocaleProvider>
        ├── App.test.tsx                        # Integración: flujo completo
        ├── CoordinatesCard.test.tsx             # Éxito, carga y error de coordenadas
        ├── MunicipalityCard.test.tsx            # Éxito, carga y error de municipio
        ├── ProvinceListCard.test.tsx
        ├── PermissionCard.test.tsx
        ├── LocaleProvider.test.tsx
        ├── LocaleSwitcher.test.tsx
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
| `lib/`        | Acceso a red, almacenamiento, validación de datos y telemetría. Sin JSX, sin conocimiento de React — reusable en cualquier otro contexto (Node, otra UI).                                                                         |
| `locales/`    | Los mensajes de la UI en cada idioma — sin lógica, solo datos y su tipo (`MessagesShape`).                                                                                                                                        |
| `i18n/`       | El mecanismo: contexto, detección, persistencia y sincronización con `document.*`. Ningún otro archivo sabe cómo se elige o se guarda el locale — solo consume `useLocale()`.                                                     |
| `hooks/`      | Un hook por feature. Cada uno encapsula su propio estado (`data`, `loading`, `error`) y expone una API mínima al componente. No conocen el DOM.                                                                                   |
| `components/` | Solo presentación. Reciben datos y callbacks de los hooks, renderizan JSX. `ProvinceListCard` es genérico y parametrizado (`endpoint`, `title`) — reemplaza el par de secciones casi idénticas que existía en la versión vanilla. |
| `styles/`     | Composición de utilidades de Tailwind reutilizadas entre componentes (variantes de botón, tarjeta, celda de tabla) — evita repetir la misma cadena de clases palabra por palabra en 3 o 4 archivos.                               |
| `App.tsx`     | Único componente que conoce la composición completa de la página y decide qué se muestra según el estado del permiso.                                                                                                             |

---

## Tecnología utilizada

- **React 19** con hooks (sin clases, salvo `ErrorBoundary`, que todavía lo requiere).
- **TypeScript** en modo `strict`, con `noUnusedLocals` y `noUnusedParameters`. `pnpm build` corre `tsc -b` antes de `vite build` — un error de tipos rompe el build, no es solo una advertencia del editor.
- **Tailwind CSS v4** (`@tailwindcss/vite`) para la mayor parte de los estilos — todos los componentes usan utilidades Tailwind o variantes compartidas; ver [Estilos (Tailwind CSS)](#estilos-tailwind-css).
- **zod** para validar en runtime la forma de las respuestas de la API externa, con los tipos de TypeScript inferidos del esquema (`z.infer`).
- **Vite 8** como build tool y dev server — usa el nuevo pipeline `oxc` para transformar y bundlear.
- **Vitest + jsdom** para tests unitarios y de integración.
- **@testing-library/react** + **@testing-library/user-event** — tests que simulan interacción real del usuario, no implementación interna de los componentes.
- **oxlint** — linter basado en Rust, con los plugins `react` (`rules-of-hooks`, detección de `setState` dentro de efectos) y `jsx-a11y` (accesibilidad) habilitados.
- **Prettier** — formato de código automático.
- **@fontsource** — Space Grotesk e Inter autoalojadas (sin depender de la CDN de Google Fonts).
- **GitHub Actions** — CI que corre formato, lint, typecheck, tests y build en cada push/PR.

No hay backend propio: toda la lógica corre en el navegador del usuario.

---

## Estilos (Tailwind CSS)

La mayor parte de la UI se estiliza con utilidades de Tailwind directamente en el JSX. `src/index.css` contiene la entrada de Tailwind, los tokens `@theme` y los estilos base. Todos los componentes usan utilidades Tailwind o variantes compartidas. La identidad visual (paleta, tipografías, radios, sombra) se expresa mediante `@theme`, así que `bg-accent`, `font-heading`, `rounded-card`, etc. son utilidades generadas a partir de esos tokens.

```css
/* src/index.css */
@theme {
    --color-accent: #0f6e5a;
    --font-heading: 'Space Grotesk', 'Segoe UI', sans-serif;
    --radius-card: 10px;
    --breakpoint-tablet: 700px;
    --breakpoint-desktop: 1080px;
    /* ... */
}
```

### Por qué un módulo de variantes (`src/styles/variants.ts`) en vez de repetir clases

Un botón necesita ~15 utilidades encadenadas (`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 ...`). Copiar esa cadena en `PermissionCard`, `CoordinatesCard` y `MunicipalityCard` — con la única diferencia real siendo 2-3 clases de color según la variante — es el mismo tipo de duplicación que ya se resolvió en otras capas del proyecto (`sortByName.ts`, `useCachedResource.ts`). La solución es la misma: una función (`buttonClasses('primary' | 'secondary' | 'retry')`, `cardClasses('accent' | 'warning')`) como única fuente de verdad de cada variante visual, en vez de una convención que hay que acordarse de copiar bien.

---

## Arquitectura y gestión de estado

- **`useGeolocationPermission`** modela el permiso como una máquina de estados explícita (`idle | requesting | granted | denied | unsupported | error`), no como una combinación de `disabled`, clases CSS y texto libre. `denied` y `error` reciben el mismo tratamiento de "Reintentar" — para el usuario son el mismo caso: algo no funcionó y puede volver a intentar.
- **`useCachedResource`** es la única implementación de fetch+caché+cancelación+protección de carrera del proyecto. `useProvinces` y
- **Cancelación real**: el `useEffect` de `useCachedResource` cancela la petición en curso tanto si cambia `cacheKey` como si el componente se desmonta.
- **Sin manipulación manual del DOM**: no hay un solo `document.getElementById` en toda la capa de componentes. React decide qué renderizar a partir del estado.

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

- **CSP estricta para producción** declarada en `index.html`: `script-src 'self'`, `script-src-attr 'none'`, `style-src 'self'`, `style-src-attr 'none'`, `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests` y `connect-src` limitado a la API de datos.gob.ar. No usa `'unsafe-inline'` ni `'unsafe-eval'`; al autoalojar las fuentes con `@fontsource`, no hace falta permitir `fonts.googleapis.com`/`fonts.gstatic.com`.
- **Desarrollo separado**: esta CSP está pensada para `pnpm build` + `pnpm preview` o el hosting de producción. No se agregó ninguna configuración que modifique el HMR o el WebSocket de `pnpm dev`.
- **`frame-ancestors`**: no se agrega al meta porque la especificación indica que esa directiva se ignora allí. En producción debe enviarse como header HTTP para impedir que la aplicación sea embebida: `frame-ancestors 'none'`.
- **Header recomendado en producción**: enviar exactamente `Content-Security-Policy: default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-attr 'none'; font-src 'self'; connect-src 'self' https://apis.datos.gob.ar; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`. El meta queda como defensa en profundidad cuando el hosting todavía no configura headers.
- **Resultado de la auditoría runtime**: no se encontraron `<style>` ni atributos `style="..."` literales, `eval`, `new Function`, timers con strings, handlers HTML inline, inyección HTML ni librerías cliente que agreguen scripts/estilos inline. Las únicas llamadas externas observadas fueron `https://apis.datos.gob.ar/georef/api/...`; no se detectaron violaciones CSP en `pnpm preview`.
- **Permissions Policy recomendada**: la app usa únicamente geolocalización. El hosting puede enviar `Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=(), usb=()`. No es una directiva CSP y no debe agregarse al meta CSP.
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

**Completo.** La app soporta español e inglés con selector de idioma, persistencia y detección automática — no queda ningún texto hardcodeado en un componente ni un shim apuntando a un solo idioma fijo.

### Fase 1 — la forma de los mensajes

Dos locales completos: `src/locales/es.ts` (español, fuente de verdad) y `src/locales/en.ts` (inglés). Todos los componentes y hooks consumen `messages.sección.clave` a través de `useLocale()` — nunca un string literal.

#### Por qué esto no se resolvió con `zod`

`zod` valida datos externos en runtime — es la herramienta correcta para las respuestas de la API (`lib/schemas.ts`), porque esos datos llegan de afuera y no se puede confiar en su forma hasta verla. Los mensajes de traducción son distintos: son un objeto estático, escrito en el propio código, conocido en compile-time. Para garantizar que `en.ts` tenga exactamente las mismas claves que `es.ts` (ni de más, ni de menos, con el mismo tipo de valor en cada una), la herramienta correcta es el sistema de tipos de TypeScript, no una librería de validación en runtime — es gratis en tiempo de ejecución y el error aparece en el editor, no en producción.

#### Cómo se garantiza la paridad entre locales

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

`satisfies` ya garantiza la paridad en compile-time, pero `src/tests/locales.test.ts` lo vuelve a chequear en runtime — por si algún día se corre `vitest` sin haber corrido `tsc` antes.

### Fase 2 — selector de locale

- **`src/i18n/localeContext.ts`** define `LocaleContext` y el hook `useLocale()` — separados del componente `LocaleProvider` a propósito (mezclarlos en un mismo archivo rompe React Fast Refresh; oxlint lo señala con `react/only-export-components`). `useLocale()` lanza si se usa fuera de un `<LocaleProvider>`, en vez de devolver silenciosamente un locale por defecto: un error explícito en desarrollo es preferible a un componente que muestra el idioma equivocado sin que nadie lo note.
- **`src/i18n/LocaleProvider.tsx`** — el componente. Detecta el locale inicial en este orden: preferencia guardada en `localStorage` → `navigator.language` (si empieza con `"en"`) → español por defecto. Persiste cada cambio en `localStorage` (degrada sin romper si falla — modo privado, cuota excedida). Sincroniza `document.documentElement.lang`, `document.title` y `<meta name="description">` en un efecto — esos tres viven en `index.html`, fuera del árbol de React, así que `messages.*` no los cubre por sí solo.
- **`src/components/LocaleSwitcher.tsx`** — dos botones (no un `<select>`: con solo dos opciones, ambas quedan visibles sin abrir nada), dentro de un `<fieldset>` con `<legend>` visualmente oculto en vez de `role="group"` + `aria-label` (más semántico; lo señaló el propio linter). `aria-pressed` comunica cuál está activo.
- **El mensaje de permiso se deriva, no se congela**: `useGeolocationPermission` calcula el texto a partir de `status` + el locale activo en cada render, en vez de guardar el string ya resuelto en el estado en el momento del evento. Si guardara el string, cambiar de idioma con un mensaje ya en pantalla lo dejaría congelado en el idioma viejo hasta la próxima acción del usuario.
- **`ErrorBoundary` es una clase**, así que no puede usar `useLocale()` (es un hook). Lee el locale activo vía `static contextType = LocaleContext` — la forma en la que los componentes de clase consumen contexto — con un fallback a español si por algún motivo se renderizara fuera de un `LocaleProvider`.

### Cómo probarlo

El selector de idioma está en el encabezado de la página. El cambio es inmediato (sin recargar), persiste entre visitas (misma pestaña o no, vía `localStorage`), y si nunca elegiste nada, un navegador configurado en inglés arranca en inglés automáticamente.

---

## Tests automatizados

**93 tests en 19 archivos** con Vitest + React Testing Library, en dos niveles:

- **Unitarios** (`lib/`, hooks individuales): prueban cada pieza en aislamiento, mockeando sus dependencias.
- **De integración** (`App.test.tsx`): montan la aplicación completa y verifican el flujo real del usuario. Incluye el test que la versión vanilla nunca tuvo — reproduce el bug de arquitectura original (un error que ocurre _después_ de conceder el permiso) y verifica que sea visible, no que quede huérfano en una sección oculta.

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

`oxlint` señala hoy **1 warning** (no error), centralizado en `useCachedResource.ts`. Corresponde a una actualización de estado dentro de un efecto y queda documentado como deuda técnica; no impide el build ni la ejecución de tests.

---

## Integración continua

`.github/workflows/ci.yml` corre en cada push/PR a `main`: instala dependencias con `pnpm --frozen-lockfile`, valida formato, lint, **typecheck**, tests y build de producción, en ese orden. Un PR no debería poder mergearse si alguno de esos pasos falla.

---

## Desarrollo local

### Requisitos

- Node.js 20 o superior. CI usa Node.js 20.
- pnpm 9.12.3, declarado en `package.json`. Con Corepack: `corepack enable` y luego `corepack prepare pnpm@9.12.3 --activate`.
- Un navegador con soporte para la Geolocation API. Fuera de `localhost`, el sitio debe servirse mediante HTTPS.

### Instalar y ejecutar

```bash
pnpm install --frozen-lockfile
pnpm dev                         # http://localhost:5173, HMR habilitado
pnpm build                       # typecheck + build Vite en dist/
pnpm preview                     # sirve dist/ en http://localhost:4173
pnpm preview --host 127.0.0.1   # alternativa explícita para acceso local
```

`pnpm dev` es el servidor de desarrollo y usa el cliente HMR de Vite. La CSP documentada en [Seguridad](#seguridad) está pensada para el artefacto de producción y no debe usarse para evaluar el funcionamiento del HMR.

También están disponibles las tareas equivalentes desde VS Code: `install-dependencies`, `test`, `build`, `dev` y `preview`. La configuración de depuración `Debug Vite (pnpm dev)` ejecuta primero `prepare-debug` y después inicia `dev`.

### Comandos de verificación

```bash
pnpm typecheck       # tsc -b
pnpm lint            # oxlint
pnpm test            # Vitest, 93 tests en 19 archivos
pnpm format:check    # Prettier en modo verificación
pnpm build           # typecheck + vite build
```

Para probar el build real antes de desplegar, ejecutar `pnpm build` y luego `pnpm preview`. El servidor de preview no reemplaza la configuración de headers del hosting: `frame-ancestors` y `Permissions-Policy` solo se pueden comprobar completamente contra los headers HTTP reales del entorno de despliegue.

---

## Build y despliegue

`pnpm build` genera un `dist/` completamente estático (HTML + JS + CSS + fuentes, con hashes de contenido en los assets), desplegable en cualquier hosting estático:

- **Netlify / Vercel**: build command `pnpm build`, publish directory `dist`.
- **GitHub Pages**: requiere configurar `base` en `vite.config.ts` si el sitio no se sirve desde la raíz del dominio.
- **Cualquier hosting tradicional**: subir el contenido de `dist/` a la raíz o a un subdirectorio.

El despliegue local de producción es `pnpm build` seguido de `pnpm preview`; no requiere backend propio ni variables de entorno. Las llamadas a la API se realizan desde el navegador hacia `https://apis.datos.gob.ar/georef/api`.

Como la Geolocation API requiere un contexto seguro, el sitio debe servirse bajo **HTTPS** (u opcionalmente `http://localhost` en desarrollo). Netlify, Vercel y GitHub Pages proveen HTTPS automático.

No hay en este repositorio evidencia de un proveedor concreto ni archivos de headers (`vercel.json`, `netlify.toml`, `nginx.conf`, `Dockerfile` o `_headers`). Por eso no se agrega una configuración específica que podría no ser leída por el hosting elegido. Antes del primer deploy, trasladá el header recomendado de la sección [Seguridad](#seguridad) al mecanismo de headers del proveedor.

### Checklist de seguridad antes de producción

- [ ] Ejecutar `pnpm install --frozen-lockfile`, `pnpm test` y `pnpm build`.
- [ ] Servir `dist/` con HTTPS y verificar que el header HTTP real incluya `frame-ancestors 'none'`.
- [ ] Confirmar que `Content-Security-Policy` no contiene `'unsafe-inline'` ni `'unsafe-eval'` y que `connect-src` solo permite `self` y `https://apis.datos.gob.ar`.
- [ ] Abrir `pnpm preview` o el deploy con DevTools y recorrer idioma, permiso, coordenadas, municipio y ambos listados.
- [ ] Revisar la consola y Network: no debe haber mensajes `Refused to...`, requests a dominios no declarados ni recursos HTTP mixtos.
- [ ] Verificar `Permissions-Policy` con `geolocation=(self)`, `camera=()` y `microphone=()`.

---

## Deuda técnica conocida

Auditoría realizada el 21/09/2026 contra el código, la configuración y la suite actual:

- **Warning de React en `useCachedResource` (prioridad media)**: `oxlint` señala una actualización síncrona de estado dentro de un efecto. El comportamiento está cubierto por tests y no rompe el build, pero conviene rediseñar la carga para evitar renders en cascada y retirar el warning.
- **Timeout y cancelación del backoff (prioridad media)**: `fetchJson` reintenta errores de red y respuestas no-OK, pero no impone un tiempo máximo a `fetch` ni interrumpe el `setTimeout` entre reintentos cuando el `AbortSignal` ya fue cancelado. Una red bloqueada puede dejar una operación esperando indefinidamente.
- **Telemetría de desarrollo (prioridad media)**: `reportError` solo escribe en `console.error`; no hay captura remota, agrupación ni alertas para producción.
- **Sin regresión visual automatizada (prioridad baja)**: los 93 tests cubren comportamiento, pero no comparan capturas en desktop/móvil. Un cambio de utilidades Tailwind podría alterar el layout sin fallar la suite.
- **Contrato externo mantenido a mano (prioridad baja)**: `zod` valida la forma de las respuestas de Georef, pero no existe una especificación versionada ni generación automática de esquemas.
- **i18n limitado (prioridad baja)**: solo hay español e inglés, sin pluralización ni formateo localizado de números/fechas.
- **Escala de utilidades Tailwind (prioridad baja)**: permanecen algunos valores arbitrarios como `text-[0.95rem]` y `px-[0.7rem]` para conservar la paridad visual de la migración. Podrían normalizarse en una pasada de diseño posterior.

Comprobaciones de la auditoría:

- `pnpm test`: 93 tests en 19 archivos, todos pasan.
- `pnpm test:coverage`: 99,87 % de cobertura de líneas; los componentes de coordenadas y municipio quedan cubiertos al 100 %.
- `pnpm build`: typecheck y build de producción pasan.
- `pnpm lint`: termina correctamente con un único warning, el de `useCachedResource` indicado arriba.

Estas deudas quedan documentadas a propósito en vez de ocultarse:
