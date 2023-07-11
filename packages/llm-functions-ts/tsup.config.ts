import { defineConfig } from 'tsup';

export default defineConfig((opts) => ({
  entry: ['./src/index.ts'],
  splitting: true,
  sourcemap: true,
  clean: !opts.watch,
  dts: true,
  format: ['esm', 'cjs',],
  external: ['react', 'react-dom'],
  ignoreWatch: [
    '**/.turbo',
    '**/dist',
    '**/node_modules',
    '**/.DS_STORE',
    '**/.git',
  ],
}));
