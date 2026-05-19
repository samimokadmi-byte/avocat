import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-pdf':     ['jspdf', 'pdfjs-dist'],
          'vendor-office':  ['mammoth'],
          'vendor-ui':      ['lucide-react'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: 'all',
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
})
