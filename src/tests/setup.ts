import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
    cleanup()
    sessionStorage.clear()
    vi.restoreAllMocks()
})
