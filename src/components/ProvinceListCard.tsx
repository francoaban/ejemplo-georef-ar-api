import { useId } from 'react'
import { useProvinceList, type ListEndpoint } from '../hooks/useProvinceList.js'
import type { Provincia } from '../lib/schemas.js'
import { ErrorMessage } from './ErrorMessage.js'
import { Spinner } from './Spinner.js'
import { messages } from '../lib/messages.js'

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
    const selectId = useId()
    const titleId = useId()

    return (
        <section className="flex flex-col gap-[0.9rem] rounded-card border border-border border-l-4 border-l-accent bg-surface p-6 shadow-card" aria-labelledby={titleId}>
            <h2 id={titleId} className="text-[1.15rem]">
                {title}
            </h2>

            <div className="flex flex-col gap-[0.4rem]">
                <label className="text-[0.9rem] font-semibold" htmlFor={selectId}>{messages.provinceList.provinciaLabel}</label>
                <select
                    id={selectId}
                    className="rounded-lg border border-border bg-surface px-[0.7rem] py-[0.55rem] font-body text-[0.95rem] text-ink focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
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

            <div className="empty:hidden max-h-[260px] overflow-y-auto rounded-lg border border-border px-2 py-1" aria-live="polite" aria-busy={loading}>
                {loading && (
                    <p className="m-0 flex items-center gap-[0.6rem] px-[0.2rem] py-[0.6rem] text-muted">
                        <Spinner />
                        {messages.provinceList.loading}
                    </p>
                )}
                {!loading && items.length > 0 && (
                    <ol className="m-0 list-decimal pl-[1.4rem]">
                        {items.map(item => (
                            <li className="border-b border-dashed border-border py-[0.3rem] last:border-b-0" key={item.nombre}>{item.nombre}</li>
                        ))}
                    </ol>
                )}
            </div>
        </section>
    )
}
