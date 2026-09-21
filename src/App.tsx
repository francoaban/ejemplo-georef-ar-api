import { useCallback, useEffect, useRef, useState } from 'react'
import { Header } from './components/Header.js'
import { PermissionCard } from './components/PermissionCard.js'
import { CoordinatesCard } from './components/CoordinatesCard.js'
import { MunicipalityCard } from './components/MunicipalityCard.js'
import { ProvinceListCard } from './components/ProvinceListCard.js'
import { useProvinces } from './hooks/useProvinces.js'
import { ErrorMessage } from './components/ErrorMessage.js'
import { useLocale } from './i18n/localeContext.js'
import { cardClasses } from './styles/variants.js'

export default function App() {
    const [permissionGranted, setPermissionGranted] = useState(false)
    const {
        provinces,
        loading: provincesLoading,
        error: provincesError
    } = useProvinces(permissionGranted)
    const contentHeadingRef = useRef<HTMLHeadingElement>(null)
    const { messages } = useLocale()

    const handleGranted = useCallback(() => {
        setPermissionGranted(true)
    }, [])

    useEffect(() => {
        if (permissionGranted) contentHeadingRef.current?.focus()
    }, [permissionGranted])

    return (
        <div id="page-content" className="mx-auto max-w-[960px] p-4 tablet:p-6 desktop:p-12">
            <Header />
            <main className="grid grid-cols-1 gap-5 tablet:grid-cols-2">
                {!permissionGranted && <PermissionCard onGranted={handleGranted} />}

                {permissionGranted && (
                    <>
                        <CoordinatesCard headingRef={contentHeadingRef} />
                        <MunicipalityCard />

                        {provincesError && (
                            <section className={cardClasses()} aria-live="polite">
                                <ErrorMessage>{provincesError}</ErrorMessage>
                            </section>
                        )}

                        <ProvinceListCard
                            title={messages.provinceList.localitiesTitle}
                            endpoint="localidades"
                            provinces={provinces}
                            provincesLoading={provincesLoading}
                        />
                        <ProvinceListCard
                            title={messages.provinceList.municipalitiesTitle}
                            endpoint="municipios"
                            provinces={provinces}
                            provincesLoading={provincesLoading}
                        />
                    </>
                )}
            </main>
        </div>
    )
}
