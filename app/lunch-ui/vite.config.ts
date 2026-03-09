import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/odata/v4': {
        target: 'http://localhost:4005',
        changeOrigin: true,
      },
      '/btp-auth': {
        target: 'https://proconarum-development-system.authentication.eu10.hana.ondemand.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/btp-auth/, ''),
        secure: true,
      },
      '/btp-scim': {
        target: 'https://api.authentication.eu10.hana.ondemand.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/btp-scim/, ''),
        secure: true,
      },
    }
  }
})
