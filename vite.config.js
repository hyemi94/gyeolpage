import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 로 두면 도메인 루트가 아닌 하위 폴더에 올려도 동작합니다.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: false },
  server: { host: true }
});
