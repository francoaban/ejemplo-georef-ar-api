import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react(), tailwindcss()],
    ...(mode === 'test' && {
        esbuild: { jsx: 'automatic' as const, jsxImportSource: 'react' }
    }),
    test: {
        environment: 'jsdom',
        setupFiles: './src/tests/setup.ts',
        include: ['src/**/*.test.{ts,tsx}'],
        css: false,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/main.tsx', 'src/tests/**']
        }
    }
}))
