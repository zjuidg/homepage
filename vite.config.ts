import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { compressTeasers } from './scripts/vite-plugin-compress-teasers'

export default defineConfig({
  plugins: [solid(), compressTeasers()],
  server: {
    // honor the port assigned by the preview tooling (PORT env), else default
    port: Number(process.env.PORT) || 5173,
  },
})
