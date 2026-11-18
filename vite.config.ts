import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { compressTeasers } from './scripts/vite-plugin-compress-teasers'

export default defineConfig({
  plugins: [solid(), compressTeasers()],
  build: {
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        news: resolve(import.meta.dirname, 'news/index.html'),
      },
    },
  },
  server: {
    // honor the port assigned by the preview tooling (PORT env), else default
    port: Number(process.env.PORT) || 5173,
  },
})
