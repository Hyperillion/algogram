import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('C:/Users/AndyYe/private.key'),
      cert: fs.readFileSync('C:/Users/AndyYe/certificate.crt')
    },
    host: 'localhost',
    port: 5173
  }
})
