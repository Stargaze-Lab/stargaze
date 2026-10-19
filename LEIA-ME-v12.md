# Stargaze — versão completa v12 · 17/10/2026

Este ZIP contém a fonte completa do site, o cartão Switzerland 2050, a capa vetorial interativa, os JSONs e o estudo Swiss Made v1.3 já compilado em `public/studies/swiss-made/`. Não precisa aplicar o patch v11.

1. Extraia o ZIP e mescle o conteúdo de `stargaze/` na raiz do seu repositório. Preserve seu histórico, notas e alterações posteriores ao material compartilhado aqui.
2. Rode `npm ci` e `npm run build` (Node 22).
3. Rode `npm run preview` e confira a home, o cartão e `/studies/swiss-made/`.
4. Faça commit e push pelo seu fluxo habitual. O GitHub Actions incluído publica o build.

A rota anterior `/studies/switzerland-2050/` redireciona para `/studies/swiss-made/`. O identificador interno do cartão continua `switzerland-2050`, preservando textos e capa. Isso não altera o endereço de destino.

## Field Notes

Já é possível publicar arquivos `field-notes/AAAA-MM-DD-slug.md`. Veja `field-notes/README.md` e duplique `_modelo.md`. Somente notas com `status: published` entram na home. Nenhuma nota de exemplo foi publicada.

## Atualizar Swiss Made depois

Para publicar um novo build, coloque o conteúdo do dist do estudo diretamente em `public/studies/swiss-made/` (index.html, assets e data), substituindo o build anterior. Não coloque uma pasta dist dentro dessa pasta.

O código editável do estudo v1.3 foi preservado em `study-sources/swiss-made/`. Ele tem seu próprio package.json; o build principal usa a versão pronta em public e não recompila o estudo. Para editar o estudo, instale suas dependências, gere seu build e copie o resultado para public/studies/swiss-made.

O pacote não inclui dependências instaladas nem o dist da home: ambos são recriados pelos comandos acima. Nenhuma alteração foi publicada remotamente nesta entrega.

## Verificação

Build de produção, importação Markdown (rascunhos, imagens, datas e remoção), isolamento do editor e navegação dos projetos verificados. O build mantém avisos existentes de diretivas use client no pacote React, sem impedir a geração.
