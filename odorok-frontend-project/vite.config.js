import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const DEFAULT_API_BASE_URL = 'https://odorok.duckdns.org/api'
const rawApiBaseUrl = (process.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/,'')
const resolvedApiUrl = new URL(rawApiBaseUrl)
const apiProxyTarget = resolvedApiUrl.origin
const apiProxySecure = resolvedApiUrl.protocol === 'https:'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: apiProxySecure
      }
    }
  }
})
