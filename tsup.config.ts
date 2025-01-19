import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs'],
  entry: ['./src/index.ts', './src/client/public/app.ts'],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  minify: true,
});
