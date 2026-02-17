import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
                            base: '/',  // ← explicitly set to root (default, but force it)
build: {
  outDir: 'dist',
  emptyOutDir: true,
  sourcemap: true,  // helps debug
},
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
},
})
