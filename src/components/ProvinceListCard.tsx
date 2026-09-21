import { useId } from 'react'
import { useProvinceList, type ListEndpoint } from '../hooks/useProvinceList.js'
import type { Provincia } from '../lib/schemas.js'
import { ErrorMessage } from './ErrorMessage.js'
import { Spinner } from './Spinner.js'
import { useLocale } from '../i18n/localeContext.js'
import { cardClasses, cardTitleClasses, selectClasses } from '../styles/variants.js'

interface ProvinceListCardProps {
    title: string
    endpoint: ListEndpoint
    provinces: Provincia[]
    provincesLoading: boolean
}

export function ProvinceListCard({
    title,
    endpoint,
    provinces,
    provincesLoading
}: ProvinceListCardProps) {
    const { province, setProvince, items, loading, error } = useProvinceList(endpoint)
    const { messages } = useLocale()
    const selectId = useId()
    const titleId = useId()

    return (
        <section className={cardClasses()} aria-labelledby={titleId}>
            <h2 id={titleId} className={cardTitleClasses}>
                {title}
            </h2>

            <div className="flex flex-col gap-[0.9rem]">
                <label htmlFor={selectId}>{messages.provinceList.provinciaLabel}</label>
                <select
                    id={selectId}
                    className={selectClasses}
                    value={province}
                    disabled={provincesLoading}
                    onChange={event => setProvince(event.target.value)}
                >
                    <option value="-1">
                        {provincesLoading
                            ? messages.provinceList.loadingProvincias
                            : messages.provinceList.selectPlaceholder}
                    </option>
                    {provinces.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.nombre}
                        </option>
                    ))}
                </select>
            </div>

            <ErrorMessage>{error}</ErrorMessage>

            <div aria-live="polite" aria-busy={loading}>
                {loading && (
                    <p className="flex items-center gap-2 text-text-muted">
                        <Spinner />
                        {messages.provinceList.loading}
                    </p>
                )}
                {!loading && items.length > 0 && (
                    <ol className="max-h-64 overflow-y-auto rounded-lg border border-border p-4">
                        {items.map((item, index) => (
                            <li
                                className="border-b border-border py-2 last:border-b-0"
                                key={`${item.nombre}-${index}`}
                            >
                                {item.nombre}
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </section>
    )
}
