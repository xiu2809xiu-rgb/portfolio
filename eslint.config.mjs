import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Vendored component-registry code.
 *
 * These files are pulled in verbatim by `npx shadcn add` from React Bits, Magic UI,
 * ReUI, efferd, shadcn.space, Motion, and shadcn/ui. They are dependencies that
 * happen to live in the repo, not code this project authors — re-linting them would
 * mean hand-patching every file on each upgrade. First-party code under `src/app`,
 * `src/core`, `src/infrastructure`, `src/content`, `src/lib`, and the non-vendor
 * component folders is linted normally.
 */
const VENDOR_GLOBS = [
  'src/components/ui/**',
  'src/components/react-bits/**',
  'src/components/magicui/**',
  'src/components/efferd/**',
  'src/components/reui/**',
  'src/components/motion-ui/**',
  'src/components/shadcn-space/**',
  'src/components/blocks/**',
  'src/assets/**',
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated SQL and local scratch files.
    'drizzle/**',
    'scripts/_probe.mjs',
  ]),

  {
    files: VENDOR_GLOBS,
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-img-element': 'off',
      'jsx-a11y/alt-text': 'off',
    },
  },

  {
    // Node-only tooling; not part of the app bundle.
    files: ['scripts/**/*.mjs', '*.config.ts', '*.config.mjs'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);

export default eslintConfig;
