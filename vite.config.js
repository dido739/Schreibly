import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0', // Принуждава Vite да използва 127.0.0.1
    port: 5173,         // Можете да укажете и конкретен порт (по подразбиране е 5173)
  }
})
