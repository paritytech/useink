import { build } from '../deps/dnt.ts';
import * as fs from '../deps/std/fs.ts';
import * as path from '../deps/std/path.ts';

const outDir = path.join('target', 'npm');

await fs.emptyDir(outDir);

await Promise.all([
  build({
    entryPoints: ['mod.ts'],
    outDir,
    importMap: 'import_map.json',
    mappings: {},
    package: {
      name: 'useink',
      version: Deno.args[0]!,
      description:
        'A React hooks library for Substrate and Wasm contracts on Substrate',
      license: 'Apache-2.0',
      repository: 'github:paritytech/useink',
    },
    compilerOptions: {
      lib: ['dom', 'esnext'],
      importHelpers: true,
      sourceMap: true,
      target: 'ES2021',
    },
    scriptModule: false,
    shims: {
      deno: {
        test: true,
      },
      webSocket: true,
    },
    test: false,
    typeCheck: false,
  }),
  fs.copy('LICENSE', path.join(outDir, 'LICENSE')),
  fs.copy('README.md', path.join(outDir, 'README.md')),
]);
