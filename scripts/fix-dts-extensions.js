import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

// TS 6 with bundler resolution doesn't rewrite .ts/.tsx extensions in emitted
// .d.ts files. This script fixes them to .js/.jsx so consumers can resolve them.
//
// It also strips side-effect CSS imports. Those are valid for the runtime JS
// bundle, but the emitted declarations otherwise point at non-existent
// dist/styles/*.css files in the published package.

const files = globSync('dist/**/*.d.ts');
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const fixed = content
    .replace(/(from\s+['"][^'"]+)\.tsx(['"])/g, '$1.jsx$2')
    .replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2')
    .split('\n')
    .filter((line) => !/^\s*import\s+['"][^'"]+\.css['"];?\s*$/.test(line))
    .join('\n');
  if (fixed !== content) writeFileSync(file, fixed);
}
