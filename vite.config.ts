import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Savyasachi/',

  server: {
    port: 5173,
    open: false
  },

  build: {
    target: 'esnext'
  }
});
