import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3005,
    watch: {
      // Use polling instead of inotify to avoid Linux ENOSPC file watcher limit errors
      usePolling: true,
      interval: 500,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true
      },
      '/static': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true
      }
    }
  }
})
