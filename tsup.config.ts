import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs'],
  entry: [
    './src/index.ts',
    './src/client/public/app.ts',
    './src/client/public/story.ts',
    './src/client/public/allstories.ts',
  ],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  minify: true,
});
