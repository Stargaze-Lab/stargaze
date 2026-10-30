# Stargaze v16 — site completo · 30/10/2026

Este ZIP contém a pasta **stargaze-v16** completa. Ela funciona sozinha depois de instalar as dependências. Não precisa aplicar nenhum patch anterior.

## Conferir primeiro em uma pasta separada

Extraia o ZIP em Downloads. No Terminal:

```sh
cd /Users/julianboledi/Downloads/stargaze-v16
npm ci
npm run build
npm run preview
```

Abra o endereço indicado pelo preview. Use Node 22 para corresponder à versão do GitHub Actions. Se extraiu em outro lugar, ajuste o primeiro caminho.

## Levar ao seu repositório

Depois da conferência, pare o preview com Ctrl+C. Mantenha uma cópia de segurança do repositório atual. Para copiar esta versão sem apagar outras pastas, use:

```sh
rsync -av --exclude='node_modules/' --exclude='dist/' --exclude='.git/' /Users/julianboledi/Downloads/stargaze-v16/ /Users/julianboledi/Documents/GitHub/stargaze/
cd /Users/julianboledi/Documents/GitHub/stargaze
npm ci
npm run build
```

O comando copia o conteúdo para dentro do repositório, atualiza arquivos de mesmo nome e não apaga arquivos extras. Preserve quaisquer alterações feitas depois do ZIP que enviou em 30/out, comparando-as antes de copiar.

Confira as alterações e faça commit/push pelo seu fluxo habitual. O GitHub Actions publica o build quando o push chega à branch main. Nada foi publicado remotamente por esta entrega.

## O que está incluído

- Home completa com hero, seleção de projetos, popups e navegação.
- The Label Is Not the Origin: título, descrição PT/EN, categoria, crédito, ano e link `/studies/swiss-made/`.
- Swiss Made atualizado, com todos os arquivos de `public/studies/swiss-made/` preservados do ZIP recebido.
- Wikiverso, Empires & Colonies, Celeste e os demais estudos existentes.
- Music Box, Lissajous e Chromascope com seus módulos inline restaurados.
- Scripts completos de build, cadastros de conteúdo, Field Notes e editor local.

## O que causava os erros

O envio atual continha as correções, mas faltavam 53 arquivos da estrutura completa, entre eles content/sketches, outros cadastros de projetos, módulos de src e os instrumentos. Foram restaurados os arquivos ausentes. Os arquivos de Swiss Made não foram substituídos por uma versão anterior.

O build atual gera dist a partir desta fonte completa. Não guarde atualizações apenas em dist: para atualizar um estudo, coloque seu build em public/studies/<slug>/ antes de gerar a home.

A pasta study-sources/swiss-made veio no envio com uma fonte anterior à cesta ilustrada. Foi preservada, mas não é usada pelo build da home. Para alterar o estudo, use a fonte mais recente do projeto Swiss Made e copie seu novo build para public/studies/swiss-made.

O ZIP exclui dependências instaladas e dist, que os comandos acima recriam. As instruções antigas de patches ficaram no histórico e não precisam ser executadas.
