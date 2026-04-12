import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
});
