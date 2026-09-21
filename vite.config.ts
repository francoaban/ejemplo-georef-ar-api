import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
    plugins: [tailwindcss(), react()],
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
            exclude: ['src/main.tsx', 'src/tests/**', '**/*.d.ts']
        }
    }
}))
