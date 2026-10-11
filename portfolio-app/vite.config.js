import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // three.js is lazy-loaded with the Mixtape section, so a big chunk there is fine
  build: { chunkSizeWarningLimit: 1000 },
})
