import type { ReactElement, ReactNode } from 'react'
import {
    render as rtlRender,
    renderHook as rtlRenderHook,
    type RenderOptions,
    type RenderHookOptions
} from '@testing-library/react'
import { LocaleProvider } from '../i18n/LocaleProvider.js'
import type { Locale } from '../i18n/localeContext.js'

function makeWrapper(locale: Locale) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
    }
}

export function render(
    ui: ReactElement,
    options: Omit<RenderOptions, 'wrapper'> & { locale?: Locale } = {}
) {
    const { locale = 'es', ...renderOptions } = options
    return rtlRender(ui, { wrapper: makeWrapper(locale), ...renderOptions })
}

export function renderHook<Result, Props>(
    callback: (props: Props) => Result,
    options: Omit<RenderHookOptions<Props>, 'wrapper'> & { locale?: Locale } = {}
) {
    const { locale = 'es', ...hookOptions } = options
    return rtlRenderHook(callback, { wrapper: makeWrapper(locale), ...hookOptions })
}

export { screen, waitFor, act, within, fireEvent, cleanup } from '@testing-library/react'
