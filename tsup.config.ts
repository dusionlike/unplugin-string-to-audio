import type { Options } from 'tsup'

export default <Options>{
  entryPoints: [
    'src/*.ts',
  ],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  onSuccess: 'npm run build:fix',
  external: ['microsoft-cognitiveservices-speech-sdk'],
  platform: 'node',
  target: 'node20',
  shims: true,
  banner: {
    js: 'import { createRequire } from "module";const require = createRequire(import.meta.url);',
  },
}
