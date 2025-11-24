import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'casaalan.ddns.net',
      '192.168.100.117',
	
    ]
  },
})
