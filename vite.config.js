import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Injects token variables into every SCSS file / <style lang="scss"> block.
        // _tokens.scss itself must not @use/@import anything.
        api: 'modern',
        additionalData: '@use "@/assets/styles/tokens" as *;\n',
      },
    },
  },
})
