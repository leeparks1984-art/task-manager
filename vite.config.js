import { defineConfig } from 'vite';
import react from '@tailwindcss/vite'; // Notice this imports from '@tailwindcss/vite' for v4

export default defineConfig({
  plugins: [react()],
});
