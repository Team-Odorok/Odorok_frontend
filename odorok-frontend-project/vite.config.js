import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://odorok.duckdns.org:8080', // 백엔드 서버 주소
        changeOrigin: true,                        // 요청 Origin을 대상 서버로 맞춤
        secure: false                              // 개발 단계 https 인증 무시(https일 때)
      }
    }
  }
})
