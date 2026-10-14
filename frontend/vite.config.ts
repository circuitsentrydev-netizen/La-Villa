import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
      
        //  Change 'localhost' to '127.0.0.1' to bypass Node's DNS lookups breakdown
        
        target: 'http://127.0.0.1:3000', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})