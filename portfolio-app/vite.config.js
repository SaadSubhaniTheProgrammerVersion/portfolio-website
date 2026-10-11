import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // three.js is lazy-loaded with the Mixtape section, so a big chunk there is fine
  build: { chunkSizeWarningLimit: 1000 },
  // Phone testing on the same Wi-Fi: open http://<your-ip-with-dashes>.nip.io:5173
  // (e.g. 192-168-100-4.nip.io). YouTube refuses many embeds on bare IP addresses.
  server: { allowedHosts: ['.nip.io'] },
})
