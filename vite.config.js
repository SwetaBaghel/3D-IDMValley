import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  /* SPA fallback: serve index.html for /pricing-calculator so the browser
     gets the app shell and main.jsx handles the route client-side. */
  server: {
    historyApiFallback: true,
  },
  preview: {
    // Same fallback for `vite preview`
  },
  build: {
    rollupOptions: {
      /* Single entry — index.html already covers all routes via the
         historyApiFallback above. */
    },
  },
})
