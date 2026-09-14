const statusElementId = 'permission-status'

export function showError(message) {
    document.getElementById(statusElementId).innerText = message
}

export function clearError() {
    document.getElementById(statusElementId).innerText = ''
}