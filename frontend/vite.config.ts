import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://memorydesk-movesphere.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: 'https://memorydesk-movesphere.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

