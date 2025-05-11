import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import glsl from 'vite-plugin-glsl';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@geometries': path.resolve(__dirname, './src/geometries'),
      '@glsl': path.resolve(__dirname, './src/glsl'),
      '@math': path.resolve(__dirname, './src/math'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@visuals': path.resolve(__dirname, './src/visuals'),
      '@gBufferPass': path.resolve(__dirname, './src/gBufferPass'),
      '@lightningPass': path.resolve(__dirname, './src/lightningPass'),
      '@light': path.resolve(__dirname, './src/light'),
      '@postprocessing': path.resolve(__dirname, './src/postprocessing'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag', '**/*.vs', '**/*.fs'],
      exclude: undefined,
      warnDuplicatedImports: true,
      defaultExtension: 'glsl',
      compress: false,
    }),
  ],
});
