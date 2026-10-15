import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// api.rtm.fr does not send CORS headers, so the browser talks to /api/rtm and the
// server (dev or preview) forwards to the official API. Production hosting needs the same rewrite.
const proxy = {
  '/api/rtm': {
    target: 'https://api.rtm.fr',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/rtm/, '/front'),
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
