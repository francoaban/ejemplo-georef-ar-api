import type { RefObject } from 'react'
import { useCoordinates } from '../hooks/useCoordinates.js'
import { ErrorMessage } from './ErrorMessage.js'
import { useLocale } from '../i18n/localeContext.js'
import {
    buttonClasses,
    cardClasses,
    cardTitleClasses,
    tableClasses,
    tableDataCellClasses,
    tableHeaderCellClasses,
    tableWrapperClasses
} from '../styles/variants.js'

interface CoordinatesCardProps {
    headingRef?: RefObject<HTMLHeadingElement | null>
}

export function CoordinatesCard({ headingRef }: CoordinatesCardProps) {
    const { coordinates, loading, error, fetchCoordinates } = useCoordinates()
    const { messages } = useLocale()

    return (
        <section className={cardClasses()} aria-labelledby="coordinates-title">
            <h2 id="coordinates-title" className={cardTitleClasses} ref={headingRef} tabIndex={-1}>
                {messages.coordinates.title}
            </h2>
            <button
                type="button"
                className={buttonClasses('secondary')}
                onClick={fetchCoordinates}
                disabled={loading}
            >
                {loading ? messages.coordinates.buttonLoading : messages.coordinates.buttonDefault}
            </button>

            <ErrorMessage>{error}</ErrorMessage>

            {coordinates && (
                <div className={tableWrapperClasses}>
                    <table className={tableClasses}>
                        <caption className="sr-only">{messages.coordinates.caption}</caption>
                        <thead>
                            <tr>
                                <th className={tableHeaderCellClasses} scope="col">
                                    {messages.coordinates.latitud}
                                </th>
                                <th className={tableHeaderCellClasses} scope="col">
                                    {messages.coordinates.longitud}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={tableDataCellClasses}>{coordinates.latitude}</td>
                                <td className={tableDataCellClasses}>{coordinates.longitude}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
