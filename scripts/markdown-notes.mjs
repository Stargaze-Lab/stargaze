import { readdir, readFile, realpath, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, relative, sep, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { validateNote } from '../src/note-format.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fields = new Set(['title', 'author', 'summary', 'format', 'status']);

// Deliberately small front matter: one text value per line, no YAML objects.
export async function readMarkdownNotes(root) {
  const source = resolve(root, 'field-notes');
  let files;
  try { files = await readdir(source); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const sourceReal = await realpath(source);
  const records = [];
  for (const file of files.sort()) {
    if (!file.endsWith('.md') || file.startsWith('_') || file === 'README.md') continue;
    const name = file.match(/^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/);
    if (!name) throw new Error(`Field Notes: use AAAA-MM-DD-slug.md: ${file}`);
    const text = (await readFile(resolve(source, file), 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    const header = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    if (!header) throw new Error(`${file}: faltam os metadados entre linhas --- .`);
    const meta = {};
    for (const line of header[1].split('\n')) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      const match = line.match(/^([a-z]+):\s*(.*?)\s*$/);
      if (!match || !fields.has(match[1]) || Object.hasOwn(meta, match[1])) throw new Error(`${file}: metadado inválido ou repetido: ${line}`);
      let value = match[2];
      if (value.startsWith('"')) {
        try { value = JSON.parse(value); } catch { throw new Error(`${file}: aspas inválidas em ${match[1]}.`); }
      } else if (value.startsWith("'")) {
        if (!value.endsWith("'")) throw new Error(`${file}: aspas inválidas.`);
        value = value.slice(1, -1).replace(/''/g, "'");
      }
      if (typeof value !== 'string' || value === '|' || value === '>') throw new Error(`${file}: use texto em uma linha nos metadados.`);
      meta[match[1]] = value;
    }
    const note = { schemaVersion: 2, kind: 'note', slug: name[2], date: name[1], title: '', author: '', summary: '', format: 'processo', status: 'draft', ...meta, body: text.slice(header[0].length).trim(), media: [] };
    const assets = [];
    // Drafts can reference pictures that have not been prepared yet.
    if (note.status === 'published') {
      const matches = [...note.body.matchAll(/!\[([^\]\n]*)\]\(([^\s)]+)(?:\s+"([^"\n]*)")?\)/g)];
      let body = '', cursor = 0;
      for (const [index, match] of matches.entries()) {
        const [, alt, path, caption = ''] = match;
        if (/^(?:[a-z]+:|\/|\\)/i.test(path)) throw new Error(`${file}: use uma imagem local dentro de field-notes/.`);
        const actual = await realpath(resolve(source, path));
        const rel = relative(sourceReal, actual);
        if (rel === '..' || rel.startsWith('..' + sep) || resolve(actual) === sourceReal) throw new Error(`${file}: imagem fora de field-notes/.`);
        let extension = extname(actual).slice(1).toLowerCase();
        if (extension === 'jpeg') extension = 'jpg';
        if (!['jpg', 'png', 'webp'].includes(extension)) throw new Error(`${file}: use JPG, PNG ou WebP.`);
        const bytes = await readFile(actual);
        if (bytes.length > 12 * 1024 * 1024) throw new Error(`${file}: imagem maior que 12 MB.`);
        const valid = extension === 'jpg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          : extension === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
          : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
        if (!valid) throw new Error(`${file}: o conteúdo da imagem não corresponde à extensão: ${path}`);
        const id = 'asset-' + createHash('sha256').update(bytes).update(String(index)).digest('hex').slice(0, 24);
        const media = { id, file: `${id}.${extension}`, kind: 'image', alt, caption };
        note.media.push(media); assets.push({ file: media.file, bytes });
        body += note.body.slice(cursor, match.index) + `\n\n{{media:${id}}}\n\n`;
        cursor = match.index + match[0].length;
      }
      body += note.body.slice(cursor);
      if (body.includes('![')) throw new Error(`${file}: imagem inválida; use ![Descrição](images/nome.webp "Legenda opcional").`);
      note.body = body;
    }
    const errors = validateNote(note, { draft: note.status === 'draft' });
    if (errors.length) throw new Error(`${file}: ${errors.join(' ')}`);
    records.push({ note, assets });
  }
  return records;
}

// Track only Markdown-owned folders, so removing/unpublishing a note removes
// its public page without touching publications created by the local editor.
export async function syncMarkdownAssets(root, records, legacyNotes = []) {
  const manifest = resolve(root, 'content/markdown-notes.generated.json');
  let previous = [];
  try { previous = JSON.parse(await readFile(manifest, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!Array.isArray(previous) || previous.some(slug => typeof slug !== 'string' || !slugPattern.test(slug))) throw new Error('Índice Markdown inválido.');
  const legacy = new Set(legacyNotes.map(note => note.slug));
  const current = records.filter(record => record.note.status === 'published');
  const owned = new Set(previous);
  for (const { note } of current) {
    if (legacy.has(note.slug)) throw new Error(`Field Note duplicado: ${note.slug}`);
    if (!owned.has(note.slug)) {
      try { await readdir(resolve(root, 'public/notes', note.slug)); }
      catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      throw new Error(`Já existe uma publicação em notes/${note.slug}; escolha outro nome.`);
    }
  }
  for (const slug of new Set([...previous, ...current.map(record => record.note.slug)])) {
    if (legacy.has(slug)) throw new Error(`Publicação Markdown e JSON usam o mesmo nome: ${slug}`);
    await rm(resolve(root, 'public/notes', slug), { recursive: true, force: true });
  }
  for (const { note, assets } of current) {
    const target = resolve(root, 'public/notes', note.slug, 'media');
    await mkdir(target, { recursive: true });
    for (const asset of assets) await writeFile(resolve(target, asset.file), asset.bytes);
  }
  await mkdir(resolve(root, 'content'), { recursive: true });
  await writeFile(manifest, JSON.stringify(current.map(record => record.note.slug), null, 2) + '\n');
}
