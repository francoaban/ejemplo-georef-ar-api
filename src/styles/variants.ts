export type ButtonVariant = 'primary' | 'secondary' | 'retry'

const buttonBase =
    'inline-flex items-center gap-2 self-start rounded-lg px-5 py-2.5 ' +
    'text-[0.95rem] font-semibold transition motion-reduce:transition-none ' +
    'active:scale-[0.98] focus-visible:outline focus-visible:outline-2 ' +
    'focus-visible:outline-offset-2 focus-visible:outline-accent ' +
    'disabled:cursor-not-allowed disabled:opacity-60'

const buttonVariants: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-white hover:bg-accent-dark',
    secondary: 'border border-border bg-bg text-text hover:border-accent hover:text-accent-dark',
    retry: 'border border-warning bg-warning-bg text-warning'
}

export function buttonClasses(variant: ButtonVariant): string {
    return `${buttonBase} ${buttonVariants[variant]}`
}

export type CardAccent = 'accent' | 'warning'

const cardBase =
    'flex flex-col gap-[0.9rem] rounded-card border border-border bg-surface p-6 shadow-card'

export function cardClasses(accent: CardAccent = 'accent'): string {
    const borderAccent = accent === 'warning' ? 'border-l-warning' : 'border-l-accent'
    return `${cardBase} border-l-4 ${borderAccent}`
}

export const selectClasses =
    'w-full rounded-lg border border-border bg-bg px-5 py-2.5 ' +
    'text-[0.95rem] font-semibold text-text transition ' +
    'hover:border-accent hover:text-accent-dark ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60'

export const cardTitleClasses = 'text-[1.15rem]'
export const cardTextClasses = 'text-text-muted'

export const tableWrapperClasses = 'overflow-x-auto'
export const tableClasses = 'w-full border-collapse text-[0.95rem]'
export const tableHeaderCellClasses =
    'border border-border bg-bg px-3 py-2.5 text-left whitespace-nowrap font-heading font-semibold'
export const tableDataCellClasses = 'border border-border px-3 py-2.5 text-left whitespace-nowrap'
