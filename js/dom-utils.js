/**
 * Escapa texto antes de insertarlo como HTML, evitando XSS si la fuente
 * de datos llegara a incluir contenido no confiable.
 */
export function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text ?? ''
    return div.innerHTML
}