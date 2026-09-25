import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves project sites under /<repository-name>/.
  base: '/stock_scanner-momentum/',
})
