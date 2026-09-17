interface ErrorMessageProps {
    children?: string
}

export function ErrorMessage({ children }: ErrorMessageProps) {
    if (!children) return null
    return (
        <p className="m-0 flex min-h-[1.4em] items-center gap-2 text-[0.9rem] text-warning" role="alert">
            {children}
        </p>
    )
}
