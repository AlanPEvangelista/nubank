import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'casaalan.ddns.net',
      '192.168.100.117',
    ],
    host: '0.0.0.0',
    port: 8082,
    proxy: {
      // Qualquer rota que comece com esses nomes será jogada para o backend
      '/applications': 'http://127.0.0.1:3001',
      '/earnings': 'http://127.0.0.1:3001',
      '/stats': 'http://127.0.0.1:3001',
      '/health': 'http://127.0.0.1:3001'
    }
  },
})
