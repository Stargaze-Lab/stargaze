import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const mainPath = resolve(process.cwd(), 'src/main.js');
let source;

try {
  source = await readFile(mainPath, 'utf8');
} catch {
  console.error('Não encontrei src/main.js. Execute este comando na raiz do repositório Stargaze.');
  process.exit(1);
}

if (source.includes('project-cover-runtime.js')) {
  console.log('O suporte a capas animadas já está instalado. Nenhuma alteração foi necessária.');
  process.exit(0);
}

const edits = [
  {
    name: 'importação do runtime',
    pattern: /(import\s+\{\s*projects\s*,\s*sketches\s*\}\s+from\s+['"]\.\/projects\.generated\.js['"];?)/,
    replacement: '$1\nimport { mountProjectCovers, projectCoverMarkup } from "./project-cover-runtime.js";',
  },
  {
    name: 'marcação da capa',
    pattern: /(function\s+visualMarkup\s*\(entry,\s*large\s*=\s*false\)\s*\{)/,
    replacement: '$1\n  if (entry.cover) return projectCoverMarkup(entry, large);',
  },
  {
    name: 'montagem das capas dos cards',
    pattern: /(\n\s*bindEntryTriggers\(\);)/,
    replacement: '$1\n  previewCleanups.push(mountProjectCovers(document));',
  },
  {
    name: 'montagem da capa ampliada',
    pattern: /(document\.querySelector\(['"]#stage-art['"]\)\.innerHTML\s*=\s*visualMarkup\(entry,\s*true\);)/,
    replacement: '$1\n  if (entry.cover) cleanupSketch = mountProjectCovers(document.querySelector("#stage-art"));',
  },
  {
    name: 'limpeza da capa ampliada',
    pattern: /if\s*\(entry\.sketch\s*===\s*['"]orbit['"]\)\s*cleanupSketch\s*=\s*mountOrbit/,
    replacement: 'if (!entry.cover && entry.sketch === "orbit") cleanupSketch = mountOrbit',
  },
];

let updated = source;
for (const edit of edits) {
  if (!edit.pattern.test(updated)) {
    console.error(`Não foi possível localizar: ${edit.name}. O arquivo não foi alterado.`);
    process.exit(1);
  }
  updated = updated.replace(edit.pattern, edit.replacement);
}

await writeFile(mainPath, updated, 'utf8');
console.log('Suporte a capas animadas instalado em src/main.js.');
