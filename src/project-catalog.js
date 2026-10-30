// Accept saved home selections from before the study was renamed.
const canonicalSlug = slug => slug === 'switzerland-2050' ? 'swiss-made' : slug;

export function resolveHomeGroups(home, entries) {
  const catalog = new Map();
  for (const entry of entries) {
    const slug = canonicalSlug(entry.slug);
    if (catalog.has(slug)) throw new Error(`Projeto duplicado: ${slug}`);
    catalog.set(slug, {...entry, slug});
  }
  const seen = new Set();
  return Object.fromEntries(['selection', 'instruments', 'shelf'].map(group => [group, home[group].map(item => {
    const slug = canonicalSlug(item.slug), source = catalog.get(slug);
    if (!source) throw new Error(`Cartão ${item.slug}: cadastro ausente em content/projects ou content/sketches.`);
    if (seen.has(slug)) throw new Error(`Cartão duplicado na home: ${slug}`);
    seen.add(slug);
    const entry = {...source, ...item, slug};
    // Project copy and URLs live in the project record; home.json sets layout.
    if (source.portfolioCopy) {
      entry.title = source.title;
      entry.href = source.href;
      entry.summary = source.portfolioCopy.pt?.[0] || source.summary;
      entry.category = source.eyebrow || source.category;
    }
    if (!entry.title?.trim() || !entry.summary?.trim()) throw new Error(`Cartão ${slug}: título ou resumo ausente.`);
    if (group === 'selection' && !entry.href?.trim()) throw new Error(`Cartão ${slug}: link do estudo ausente.`);
    return entry;
  })]));
}
