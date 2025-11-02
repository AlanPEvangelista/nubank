import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    hmr: {
      host: 'casaalan.ddns.net',
    },
  },
  preview: {
    host: true,
    port: 8082,
  },
})
