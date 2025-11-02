import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  preview: {
    //host: true,
    //#port: 8082,
   // allowedHosts: ['casaalan.ddns.net'],
    allowedHosts: [
      'casaalan.ddns.net',
      // Você pode adicionar mais domínios se precisar
    ]

  },
})
