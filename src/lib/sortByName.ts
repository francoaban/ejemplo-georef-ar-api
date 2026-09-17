interface Named {
    nombre: string
}

export function sortByName<T extends Named>(items: T[]): T[] {
    return [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
