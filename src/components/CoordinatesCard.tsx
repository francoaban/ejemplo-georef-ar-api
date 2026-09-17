import type { RefObject } from 'react'
import { useCoordinates } from '../hooks/useCoordinates.js'
import { ErrorMessage } from './ErrorMessage.js'
import { messages } from '../lib/messages.js'

interface CoordinatesCardProps {
    headingRef?: RefObject<HTMLHeadingElement | null>
}

export function CoordinatesCard({ headingRef }: CoordinatesCardProps) {
    const { coordinates, loading, error, fetchCoordinates } = useCoordinates()

    return (
        <section className="flex flex-col gap-[0.9rem] rounded-card border border-border border-l-4 border-l-accent bg-surface p-6 shadow-card" aria-labelledby="coordinates-title">
            <h2 id="coordinates-title" className="text-[1.15rem]" ref={headingRef} tabIndex={-1}>
                {messages.coordinates.title}
            </h2>
            <button
                type="button"
                className="self-start rounded-lg border border-border bg-bg px-[1.2rem] py-[0.65rem] font-body text-[0.95rem] font-semibold text-ink inline-flex cursor-pointer items-center gap-2 transition-colors duration-150 active:scale-[0.98] hover:border-accent hover:text-accent-dark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 motion-reduce:transition-none"
                onClick={fetchCoordinates}
                disabled={loading}
            >
                {loading ? messages.coordinates.buttonLoading : messages.coordinates.buttonDefault}
            </button>

            <ErrorMessage>{error}</ErrorMessage>

            {coordinates && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[0.95rem]">
                        <caption className="sr-only">
                            {messages.coordinates.caption}
                        </caption>
                        <thead>
                            <tr>
                                <th className="border border-border bg-bg px-3 py-[0.6rem] text-left font-heading font-semibold whitespace-nowrap" scope="col">{messages.coordinates.latitud}</th>
                                <th className="border border-border bg-bg px-3 py-[0.6rem] text-left font-heading font-semibold whitespace-nowrap" scope="col">{messages.coordinates.longitud}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-border px-3 py-[0.6rem] text-left whitespace-nowrap">{coordinates.latitude}</td>
                                <td className="border border-border px-3 py-[0.6rem] text-left whitespace-nowrap">{coordinates.longitude}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
