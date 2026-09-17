import { useMunicipality } from '../hooks/useMunicipality.js'
import { ErrorMessage } from './ErrorMessage.js'
import { messages } from '../lib/messages.js'

export function MunicipalityCard() {
    const { municipality, loading, error, fetchMunicipality } = useMunicipality()

    return (
        <section className="flex flex-col gap-[0.9rem] rounded-card border border-border border-l-4 border-l-accent bg-surface p-6 shadow-card" aria-labelledby="municipality-title">
            <h2 id="municipality-title" className="text-[1.15rem]">
                {messages.municipality.title}
            </h2>
            <button
                type="button"
                className="self-start rounded-lg border border-border bg-bg px-[1.2rem] py-[0.65rem] font-body text-[0.95rem] font-semibold text-ink inline-flex cursor-pointer items-center gap-2 transition-colors duration-150 active:scale-[0.98] hover:border-accent hover:text-accent-dark disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2 motion-reduce:transition-none"
                onClick={fetchMunicipality}
                disabled={loading}
            >
                {loading
                    ? messages.municipality.buttonLoading
                    : messages.municipality.buttonDefault}
            </button>

            <ErrorMessage>{error}</ErrorMessage>

            {municipality && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[0.95rem]">
                        <caption className="sr-only">
                            {messages.municipality.caption}
                        </caption>
                        <thead>
                            <tr>
                                <th className="border border-border bg-bg px-3 py-[0.6rem] text-left font-heading font-semibold whitespace-nowrap" scope="col">{messages.municipality.provincia}</th>
                                <th className="border border-border bg-bg px-3 py-[0.6rem] text-left font-heading font-semibold whitespace-nowrap" scope="col">{messages.municipality.departamento}</th>
                                <th className="border border-border bg-bg px-3 py-[0.6rem] text-left font-heading font-semibold whitespace-nowrap" scope="col">{messages.municipality.municipio}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-border px-3 py-[0.6rem] text-left whitespace-nowrap">{municipality.provincia}</td>
                                <td className="border border-border px-3 py-[0.6rem] text-left whitespace-nowrap">{municipality.departamento}</td>
                                <td className="border border-border px-3 py-[0.6rem] text-left whitespace-nowrap">{municipality.municipio}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
