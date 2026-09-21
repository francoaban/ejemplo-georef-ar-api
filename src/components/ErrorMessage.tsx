interface ErrorMessageProps {
    children?: string
}

export function ErrorMessage({ children }: ErrorMessageProps) {
    if (!children) return null
    return (
        <p
            className="flex min-h-[1.4em] items-center gap-2 text-[0.9rem] text-warning empty:hidden"
            role="alert"
        >
            {children}
        </p>
    )
}
