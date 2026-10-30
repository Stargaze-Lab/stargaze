# Field Notes — texto autoral

O caderno separado abre com `npm run editor`; veja `CADERNO-LOCAL.md`. O site público contém apenas o leitor e as páginas publicadas.

**Gerar publicação** exporta um ZIP com metadados em `content/notes/` e HTML/mídias em `public/notes/<slug>/`. Extraia na raiz da cópia de revisão e execute `npm run build`. O ZIP marca a nota como `published`; gerar o arquivo não publica online. O rascunho continua `draft` no computador.

O build inclui somente `published`. Nunca coloque rascunhos em `public/`. A pasta local `.stargaze-editor/` fica fora do Git e do build.

Contrato atual: `schemaVersion: 2`, `slug`, `title`, `author`, `date` (AAAA-MM-DD), `format` (processo, ensaio, referencias), `summary`, `body`, `status`, `media`. Cada mídia tem `id`, `file`, `kind` (image/video), `alt` e `caption`; os arquivos ficam em `public/notes/<slug>/media/`. O marcador `{{media:<id>}}` insere a mídia entre parágrafos. Sem marcador, ela aparece ao final.

O corpo aceita Markdown seguro; HTML é escapado e texto não é reescrito. O leitor mantém compatibilidade com notas schemaVersion 1; o editor importa os JSONs antigos.

Conserve o slug ao revisar uma nota. Para retirar uma publicação, remova seus metadados desta pasta e sua página/mídias de `public/notes/<slug>/`, depois gere e publique um novo build.
