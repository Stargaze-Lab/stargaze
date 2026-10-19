# Publicar Field Notes em Markdown

Cada arquivo vira uma nota na home e uma página em `/notes/slug/` durante o build. O site continua estático: colocar um arquivo no servidor não executa o build. No fluxo GitHub Pages já incluído, o push para `main` dispara a publicação.

## Primeira nota

1. Duplique `_modelo.md` nesta pasta e renomeie, por exemplo, para `2026-10-17-primeiras-observacoes.md`.
2. Preencha título, autoria, resumo e texto. Use uma linha por metadado entre os dois `---`.
3. Coloque as fotos em `field-notes/images/`. Pode criar subpastas por nota.
4. Quando estiver pronto, troque `status: draft` por `status: published`.
5. Rode `npm run build` e `npm run preview` na raiz. Confira a nota na seção Field Notes e em `/notes/primeiras-observacoes/`.
6. Faça commit e push dos arquivos pelo seu fluxo habitual. Aguarde o GitHub Actions terminar.

O nome define a data e o endereço: `AAAA-MM-DD-slug.md`. Use letras minúsculas, números e hífens no slug, sem espaços ou acentos. A data ordena as notas da mais recente para a mais antiga; não agenda publicação. O mesmo slug não pode ser usado por outra nota Markdown ou JSON.

Metadados aceitos: `title`, `author`, `summary`, `format` e `status`. `format` pode ser `processo`, `ensaio` ou `referencias`. `status` pode ser `draft`, `ready` ou `published`; somente `published` aparece no site. Sem status, o padrão é rascunho. Para títulos com pontuação, pode usar aspas duplas como no exemplo abaixo. Não são suportados objetos YAML ou valores em várias linhas.

```md
---
title: "Primeiras observações: território e alimentação"
author: Seu nome
summary: Uma apresentação curta, escrita por você.
format: processo
status: draft
---

Seu texto aqui.

## Uma observação

Texto com **negrito**, *itálico*, `código` e [link](https://example.com).

![Descrição do que aparece na foto](images/primeiras-observacoes/foto.webp "Legenda e crédito opcionais")
```

O exemplo é um modelo, não uma publicação. `_modelo.md`, arquivos iniciados por `_` e este README são ignorados. Rascunhos não entram no site publicado; ainda assim, arquivos que você enviar a um repositório público poderão ser lidos no GitHub.

## Fotos

- Exporte em **WebP ou JPEG**, perfil **sRGB**, mantendo a proporção original.
- Use **1600 px no lado maior** como ponto de partida; até **2000 px** para desenhos, mapas ou fotografias que precisem de mais detalhe. Em imagens verticais isso significa altura, não largura.
- Busque aproximadamente **200–500 KB por foto**; imagens com muito detalhe podem chegar a **1 MB**. Confira visualmente antes de exportar tudo.
- PNG é útil para transparência e traços finos; evite usar originais enormes da câmera.
- Os caminhos são relativos a esta pasta: `images/nota/foto.webp`, com nomes sem espaços. JPEG, JPG, PNG e WebP são aceitos. Até 20 imagens, no máximo 12 MB cada; o build copia, mas não redimensiona nem comprime.
- O texto em `![...]` é a descrição acessível e é obrigatório para publicar. A legenda entre aspas é opcional.

## Formatação e alterações

São suportados parágrafos, títulos de até três níveis, listas com `-`, citações com `>`, negrito, itálico, código inline, links HTTP/HTTPS e imagens locais. Não é um interpretador completo de Markdown: tabelas, blocos de código, HTML incorporado e imagens remotas não fazem parte deste fluxo. Para vídeos, continue usando o editor local (`npm run editor`).

Edite o Markdown para corrigir o texto. Para retirar a nota, mude o status para `draft` ou remova o arquivo e publique um novo build. A página e as cópias de imagens dessa nota são removidas na próxima geração; outras publicações são preservadas. Evite mudar o slug depois de compartilhar o link, pois o endereço anterior deixa de existir.

O fluxo anterior por `content/notes/*.json` e pelo editor local continua funcionando. Não edite os arquivos gerados; mantenha `content/markdown-notes.generated.json` junto com o projeto para acompanhar quais páginas vieram do Markdown.

`npm run dev` importa as notas ao iniciar. Após editar uma nota com o servidor já aberto, rode `npm run sync` em outro terminal ou reinicie o servidor; para publicar, sempre gere um novo build.
