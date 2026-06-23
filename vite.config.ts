/// <reference types="vitest/config" />
import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import type { ClientRequest } from 'node:http'
import { NOMINATIM_USER_AGENT } from './src/appMeta.ts'

const googleRoutesProxy: ProxyOptions = {
  target: 'https://routes.googleapis.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/google-routes/, ''),
}

const googlePlacesProxy: ProxyOptions = {
  target: 'https://places.googleapis.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/google-places/, ''),
}

const googleStaticProxy: ProxyOptions = {
  target: 'https://maps.googleapis.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/google-static/, '/maps/api/staticmap'),
}

const nominatimProxy: ProxyOptions = {
  target: 'https://nominatim.openstreetmap.org',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq: ClientRequest) => {
      proxyReq.setHeader('User-Agent', NOMINATIM_USER_AGENT)
    })
  },
}

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/google-routes': googleRoutesProxy,
      '/api/google-places': googlePlacesProxy,
      '/api/google-static': googleStaticProxy,
      '/api/nominatim': nominatimProxy,
    },
  },
  preview: {
    proxy: {
      '/api/google-routes': googleRoutesProxy,
      '/api/google-places': googlePlacesProxy,
      '/api/google-static': googleStaticProxy,
      '/api/nominatim': nominatimProxy,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        additionalData: '@use "@/assets/styles/tokens" as *;\n',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
