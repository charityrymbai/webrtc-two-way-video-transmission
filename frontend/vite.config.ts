import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./private-key.pem'),
      cert: fs.readFileSync('./certificate.pem'),
    },
    host: '0.0.0.0',
  },
});
