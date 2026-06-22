import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  server: {
    // honor the port assigned by the preview tooling (PORT env), else default
    port: Number(process.env.PORT) || 5173,
  },
})
