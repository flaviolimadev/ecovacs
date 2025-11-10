import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    esbuild: {
        jsx: 'automatic',
        jsxDev: false,
        drop: ['console', 'debugger'], // Remove console e debugger em produção
    },
    build: {
        minify: 'esbuild',
        rollupOptions: {
            output: {
                // Suprimir warnings de chunks grandes
                manualChunks: undefined,
            },
        },
    },
});
