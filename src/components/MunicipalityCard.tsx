import { useMunicipality } from '../hooks/useMunicipality.js'
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

export function MunicipalityCard() {
    const { municipality, loading, error, fetchMunicipality } = useMunicipality()
    const { messages } = useLocale()

    return (
        <section className={cardClasses()} aria-labelledby="municipality-title">
            <h2 id="municipality-title" className={cardTitleClasses}>
                {messages.municipality.title}
            </h2>
            <button
                type="button"
                className={buttonClasses('secondary')}
                onClick={fetchMunicipality}
                disabled={loading}
            >
                {loading
                    ? messages.municipality.buttonLoading
                    : messages.municipality.buttonDefault}
            </button>

            <ErrorMessage>{error}</ErrorMessage>

            {municipality && (
                <div className={tableWrapperClasses}>
                    <table className={tableClasses}>
                        <caption className="sr-only">{messages.municipality.caption}</caption>
                        <thead>
                            <tr>
                                <th className={tableHeaderCellClasses} scope="col">
                                    {messages.municipality.provincia}
                                </th>
                                <th className={tableHeaderCellClasses} scope="col">
                                    {messages.municipality.departamento}
                                </th>
                                <th className={tableHeaderCellClasses} scope="col">
                                    {messages.municipality.municipio}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={tableDataCellClasses}>{municipality.provincia}</td>
                                <td className={tableDataCellClasses}>
                                    {municipality.departamento}
                                </td>
                                <td className={tableDataCellClasses}>{municipality.municipio}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
