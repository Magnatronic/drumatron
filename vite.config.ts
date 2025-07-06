import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// IMPORTANT: Set the base to your repo name for GitHub Pages
export default defineConfig({
  base: '/drumatron/', // Change if your repo name is different
  plugins: [react()],
})
