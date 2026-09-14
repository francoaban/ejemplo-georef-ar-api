# Mi Ubicación

Aplicación web estática que permite consultar la ubicación geográfica del usuario (coordenadas, provincia, departamento y municipio) y explorar el listado oficial de localidades y municipios de Argentina, utilizando la API pública de georreferenciación de datos.gob.ar.

No requiere backend propio, build step ni librerías externas de JavaScript: es HTML, CSS y JavaScript (ES Modules) nativos.

---

## Tabla de contenidos

- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnología utilizada](#tecnología-utilizada)
- [Flujo de la aplicación](#flujo-de-la-aplicación)
- [API de consulta](#api-de-consulta)
- [Caché y rendimiento](#caché-y-rendimiento)
- [Seguridad](#seguridad)
- [Accesibilidad](#accesibilidad)
- [Diseño responsive](#diseño-responsive)
- [Tests automatizados](#tests-automatizados)
- [Medios de despliegue](#medios-de-despliegue)
- [Ejecución local](#ejecución-local)
- [Limitaciones conocidas](#limitaciones-conocidas)

---

## Estructura del proyecto

```
mi-ubicacion/
├── index.html              # Punto de entrada único de la aplicación
├── package.json            # Metadata + scripts de test (packageManager: pnpm)
├── pnpm-lock.yaml          # Lockfile de dependencias (Vitest, jsdom)
├── vitest.config.js        # Configuración de Vitest (entorno jsdom)
├── css/
│   └── my-style.css        # Estilos: variables, layout responsive, componentes
├── js/
│   ├── main.js              # Orquestador: inicializa la app y conecta eventos
│   ├── api.js                # Acceso a red: fetch con reintentos + geolocalización
│   ├── cache.js               # Caché de sesión (sessionStorage)
│   ├── dom-utils.js            # Utilidades de DOM (escape de HTML)
│   ├── status.js                # Mensajes de error/estado compartidos
│   ├── geolocation.js            # Feature: permiso, coordenadas y municipio actual
│   └── lists.js                   # Feature: listado de provincias/localidades/municipios
└── tests/
    ├── api.test.js
    ├── cache.test.js
    ├── dom-utils.test.js
    ├── geolocation.test.js
    └── lists.test.js
```

### Responsabilidad de cada módulo JS

| Módulo | Responsabilidad | Depende de |
|---|---|---|
| `api.js` | Centraliza `fetch` con reintentos y backoff exponencial; expone `getCurrentPosition()` sobre la Geolocation API del navegador. | — |
| `cache.js` | Lee/escribe en `sessionStorage` con un prefijo propio (`georef_cache_`), sin lógica de features. | — |
| `dom-utils.js` | `escapeHtml()`: sanitiza cualquier texto antes de insertarlo como HTML. | — |
| `status.js` | `showError()` / `clearError()`: escriben el mensaje visible en `#permission-status`. | — |
| `geolocation.js` | Pide permiso de ubicación, obtiene coordenadas y resuelve provincia/departamento/municipio a partir de lat/lon. | `api.js`, `dom-utils.js`, `status.js` |
| `lists.js` | Carga provincias y, según la seleccionada, el listado de localidades o municipios. Maneja caché y cancelación de requests en curso. | `api.js`, `cache.js`, `dom-utils.js`, `status.js` |
| `main.js` | Único archivo que conoce la estructura completa de la página. Cablea los `addEventListener`, controla qué secciones se muestran/ocultan y dispara la carga inicial de provincias. | `geolocation.js`, `lists.js` |

Esta separación permite testear `api.js` y `cache.js` de forma aislada (son funciones puras o casi puras, sin acoplamiento al resto de la app) y agregar features nuevas sin tocar el core de red/caché.

---

## Tecnología utilizada

- **HTML5 semántico** — `<section>`, `<table>`, `aria-*`, sin frameworks de marcado.
- **CSS3** — variables nativas (`:root`), CSS Grid para el layout responsive, `@media` queries, sin preprocesadores ni frameworks (Tailwind, Bootstrap, etc.).
- **JavaScript ES2020+ con ES Modules nativos** (`import`/`export`) — sin bundler (Webpack, Vite, esbuild), sin transpilación, sin dependencias de `npm`.
- **Web APIs nativas del navegador**:
  - [`Geolocation API`](https://developer.mozilla.org/es/docs/Web/API/Geolocation_API) — obtención de coordenadas.
  - [`Fetch API`](https://developer.mozilla.org/es/docs/Web/API/Fetch_API) — consumo de la API REST externa.
  - [`AbortController`](https://developer.mozilla.org/es/docs/Web/API/AbortController) — cancelación de requests en curso.
  - [`sessionStorage`](https://developer.mozilla.org/es/docs/Web/API/Window/sessionStorage) — caché de datos por sesión de pestaña.
- **Tipografías**: Space Grotesk (títulos) e Inter (texto), servidas desde Google Fonts.

No hay backend propio: toda la lógica corre en el navegador del usuario.

---

## Flujo de la aplicación

1. Al cargar la página, **solo es visible** la sección "Permiso de ubicación". El resto del contenido está oculto (`class="is-hidden"`).
2. El usuario hace clic en **"Permitir acceso a mi ubicación"**, lo que dispara `requestLocationPermission()` en `geolocation.js`, que a su vez llama a `navigator.geolocation.getCurrentPosition()`.
3. Si el navegador concede el permiso:
   - Se muestra un `alert()` confirmando que se obtuvo el permiso.
   - Se oculta la sección de permiso y se revelan las cuatro secciones restantes (`main.js → revealMainContent()`).
   - Recién en ese momento se cargan las provincias desde la API (no antes, para no gastar la request si el usuario nunca concede el permiso).
4. Si el permiso es **denegado**, el botón cambia a modo "Reintentar" y el resto del contenido permanece oculto.
5. Con el contenido visible, el usuario puede:
   - Obtener sus coordenadas actuales.
   - Detectar su municipio (provincia, departamento y municipio) a partir de esas coordenadas.
   - Elegir una provincia en cualquiera de los dos selectores y ver el listado de localidades o municipios correspondiente.

---

## API de consulta

Se utiliza la **API de Georreferenciación (Georef)** del Ministerio de Economía / datos.gob.ar, de acceso público y gratuito, sin necesidad de API key.

**Base URL:** `https://apis.datos.gob.ar/georef/api`

| Endpoint usado | Método | Parámetros enviados | Uso en la app |
|---|---|---|---|
| `/provincias` | GET | `campos=nombre&max=30` | Poblar ambos `<select>` de provincia. |
| `/ubicacion` | GET | `lat`, `lon` | Resolver provincia/departamento/municipio a partir de coordenadas. |
| `/localidades` | GET | `provincia={id}&campos=nombre&max=1000` | Listado de localidades de la provincia elegida. |
| `/municipios` | GET | `provincia={id}&campos=nombre&max=1000` | Listado de municipios de la provincia elegida. |

Documentación oficial completa: [https://datosgobar.github.io/georef-ar-api/](https://datosgobar.github.io/georef-ar-api/)

### Manejo de errores y reintentos

Todas las llamadas pasan por `fetchJson()` (`api.js`), que:
- Reintenta automáticamente hasta **2 veces** ante un fallo de red o respuesta no-OK, con backoff exponencial (500ms, luego 1s).
- No reintenta si la request fue cancelada intencionalmente (`AbortError`).
- Si se agotan los reintentos, propaga el error, que las features (`geolocation.js`, `lists.js`) capturan y muestran vía `showError()`.

---

## Caché y rendimiento

- `lists.js` cachea en `sessionStorage` tanto el listado de provincias como el de localidades/municipios por provincia (clave: `endpoint:idProvincia`).
- La caché **dura solo la sesión del navegador** (se borra al cerrar la pestaña); no tiene vencimiento propio dentro de la sesión.
- Antes de lanzar una consulta nueva, se cancela con `AbortController` cualquier consulta anterior del mismo `<select>` que siga en curso, evitando condiciones de carrera si el usuario cambia de provincia rápido.
- Si `sessionStorage` no está disponible (modo privado estricto, cuota excedida), la app degrada de forma segura: simplemente no cachea, sin romper la funcionalidad.

---

## Seguridad

- **Content-Security-Policy** restrictiva declarada en el `<meta>` del `<head>`, limitando `connect-src` a la API de datos.gob.ar y `font-src`/`style-src` a Google Fonts.
- **Escape de HTML** (`escapeHtml()`) antes de insertar cualquier dato proveniente de la API en el DOM, previniendo XSS si la fuente de datos llegara a devolver contenido no confiable.
- Sin dependencias de terceros vía `npm`/CDN de JavaScript (superficie de ataque mínima por supply chain).

---

## Accesibilidad

- Encabezados jerárquicos (`h1`/`h2`) y `aria-labelledby` en cada sección.
- `role="status"` y `aria-live="polite"` en el mensaje de estado del permiso.
- `aria-busy="true/false"` en los contenedores de resultados mientras cargan, con spinner visual (`.spinner`, CSS puro).
- Estados de foco visibles (`:focus-visible`) en botones y selects para navegación por teclado.
- Tablas con `<caption>` (oculto visualmente pero accesible) y `scope="col"` en encabezados.
- Respeta `prefers-reduced-motion` para desactivar animaciones a quien las tenga deshabilitadas a nivel sistema operativo.

---

## Diseño responsive

Implementado con CSS Grid y `clamp()`, sin media queries de frameworks:

| Breakpoint | Comportamiento |
|---|---|
| **Celular** (`< 700px`) | Una sola columna, tarjetas apiladas. |
| **Tablet** (`≥ 700px`) | Grid de 2 columnas para las tarjetas de contenido; la de permiso ocupa el ancho completo. |
| **Escritorio** (`≥ 1080px`) | Igual a tablet, con mayor padding lateral (`--spacing`). |

Las tablas tienen scroll horizontal propio (`.table-scroll`) para no romper el layout en pantallas angostas.

---

## Medios de despliegue

Al ser un sitio 100% estático (HTML/CSS/JS sin build ni backend), puede desplegarse en cualquier hosting de archivos estáticos. Algunas opciones:

### 1. GitHub Pages (gratuito)
```bash
git init
git add .
git commit -m "Deploy inicial"
git branch -M main
git remote add origin <URL_DEL_REPO>
git push -u origin main
```
Luego, en **Settings → Pages** del repositorio, seleccionar la rama `main` y la carpeta raíz (`/`) como fuente.

### 2. Netlify (gratuito, con CI/CD)
- Arrastrar la carpeta del proyecto a [app.netlify.com/drop](https://app.netlify.com/drop), **o**
- Conectar el repositorio de GitHub/GitLab y configurar:
  - **Build command:** (vacío, no hay build)
  - **Publish directory:** `.` (raíz del proyecto)

### 3. Vercel (gratuito)
```bash
pnpm add -g vercel
vercel
```
Al no requerir build, Vercel lo detecta como sitio estático automáticamente.

### 4. Cualquier hosting tradicional (cPanel, FTP, etc.)
Subir el contenido completo de la carpeta `mi-ubicacion/` (manteniendo la estructura `css/` y `js/`) a la raíz del hosting o a un subdirectorio.

### Requisito importante para cualquier despliegue

Como el proyecto usa **ES Modules nativos** (`<script type="module">`), **debe servirse por HTTP/HTTPS**, nunca abriendo el `index.html` directamente con `file://`, ya que los navegadores bloquean los `import` bajo ese protocolo por política CORS. Todas las opciones de despliegue listadas arriba cumplen este requisito por defecto.

Adicionalmente, como la Geolocation API moderna solo funciona en **contextos seguros**, el sitio debe servirse bajo **HTTPS** (u opcionalmente `http://localhost` en desarrollo). GitHub Pages, Netlify y Vercel proveen HTTPS automático y gratuito.

---

## Ejecución local

Para probar el proyecto en la propia máquina, hace falta un servidor HTTP simple (no alcanza con abrir el archivo directamente, ver sección anterior). Algunas alternativas:

```bash
# Opción 1: con Python (ya viene instalado en la mayoría de los sistemas)
python3 -m http.server 8000

# Opción 2: con Node.js, sin instalación previa
pnpm dlx serve .

# Opción 3: extensión "Live Server" de VS Code
# Click derecho sobre index.html → "Open with Live Server"
```
Luego abrir `http://localhost:8000` (o el puerto que indique la herramienta elegida).

---

## Tests automatizados

El proyecto incluye una suite de **39 tests con [Vitest](https://vitest.dev/)** (entorno `jsdom`), sin frameworks de testing adicionales.

```
tests/
├── api.test.js           # fetchJson (reintentos/backoff) y getCurrentPosition
├── cache.test.js         # getFromCache / saveToCache sobre sessionStorage
├── dom-utils.test.js     # escapeHtml, incluyendo casos de intento de XSS
├── geolocation.test.js   # requestLocationPermission, getCoordinates, getMunicipality
└── lists.test.js         # loadProvinces y loadList (caché, orden, errores, AbortError)
```

### Instalación y ejecución

```bash
pnpm install
pnpm test              # corre toda la suite una vez
pnpm test:watch        # modo watch, útil durante desarrollo
pnpm test:coverage     # genera reporte de cobertura (v8)
```

> El proyecto declara `"packageManager": "pnpm@9.12.3"` en `package.json` (estándar [Corepack](https://pnpm.io/es/installation#usando-corepack)), así que `pnpm install` usará automáticamente esa versión. Si no tenés `pnpm` instalado: `corepack enable` (Node ≥ 16.13) o `npm install -g pnpm`.

### Qué cubre cada archivo

| Archivo de test | Casos cubiertos |
|---|---|
| `api.test.js` | Respuesta exitosa, reintento con backoff ante error 5xx, reintento tras fallo de red que luego se recupera, no reintentar ante `AbortError`, y los tres resultados posibles de la Geolocation API (éxito, no soportada, error del navegador). |
| `cache.test.js` | Lectura de clave inexistente, guardado/lectura, JSON corrupto, prefijo de clave, `sessionStorage` lleno/no disponible, y que el valor persiste hasta que se limpia `sessionStorage` (simulando cierre de pestaña). |
| `dom-utils.test.js` | Escape de `<`, `>`, `&`, valores `null`/`undefined`, y que un nombre malicioso no genera una etiqueta `<img>` ejecutable al insertarse en el DOM. |
| `geolocation.test.js` | Flujo completo de permiso (concedido, denegado, error genérico, navegador sin soporte), obtención de coordenadas y detección de municipio (éxito, escape de nombres, "no encontrado", error de red). |
| `lists.test.js` | Carga de provincias (API, caché, error), y `loadList` para localidades/municipios: provincia sin seleccionar, hit de caché, guardado con la clave correcta, orden alfabético, escape de HTML, error de red y cancelación silenciosa por `AbortError`. |

Las dependencias externas de cada módulo (`api.js`, `cache.js`, `status.js`) se simulan con `vi.mock()`, así que estos tests no hacen llamadas HTTP reales ni dependen de la disponibilidad de la API de datos.gob.ar.

---

## Limitaciones conocidas

- Depende enteramente de la disponibilidad de la API pública de datos.gob.ar; no hay un mock ni fallback local si el servicio cae por completo (los reintentos con backoff mitigan caídas breves, no una caída prolongada).
- La Geolocation API requiere HTTPS (o `localhost`) y permiso explícito del usuario; en navegadores/dispositivos sin soporte, la app lo informa pero no ofrece una alternativa manual de ingreso de coordenadas.
- El listado de localidades/municipios no pagina resultados grandes (usa `max=1000`); provincias con muchas localidades pueden tardar más en la primera carga (no cacheada).
- Sin linting configurado todavía (ESLint/Prettier).