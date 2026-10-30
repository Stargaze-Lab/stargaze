# Correção do cartão — v14 · 28/10/2026

## O que foi corrigido

- Título: The Label Is Not the Origin.
- Resumo visível no cartão e no popup, em português e inglês.
- Botão Abrir projeto completo apontando para `/studies/swiss-made/`.
- Categoria Data Visualization / Interactive Storytelling, ano 2026 e crédito Stargaze.
- Removidos os textos sobre animação, texturas, capa e “experimento em integração” dos popups. A ilustração suíça também perdeu o rótulo antigo “2050”.

O código anterior montava o cartão mesmo quando a seleção da home não encontrava o cadastro correspondente. Isso deixava título e link vazios. Além disso, a regra CSS geral escondia os resumos dos cartões. Agora o cadastro é lido diretamente, o identificador antigo continua aceito e um cartão incompleto impede o build, em vez de ser publicado em branco.

## Instalar

1. Extraia este ZIP e mescle seus arquivos na raiz do repositório Stargaze, na mesma pasta do package.json. Substitua os arquivos correspondentes; preserve o restante das pastas.
2. Rode `npm run build`.
3. Confira com `npm run preview`: título e resumo na home, popup e link do estudo.
4. Faça commit/push e aguarde o GitHub Actions concluir. O domínio só muda depois desse deploy.

Este pacote já contém os metadados da v13; não precisa aplicá-la antes. Ele contém a correção da home, não uma cópia antiga do Swiss Made. Nenhum arquivo de `public/studies/swiss-made/`, `study-sources/` ou Field Notes é substituído.

Mantenha o estudo atualizado em `public/studies/swiss-made/`, pois `dist/` é recriado pelo build. A correção não requer alterações no estudo.

## Verificação

Build, validação do catálogo e navegação passaram. Testado em navegador a 1440 px e 390 px: título e resumo visíveis, conteúdo PT/EN, popup, clique real no link para o estudo, próximo/anterior e fechar/reabrir. Nenhum erro JavaScript ou arquivo local ausente nesses testes. Nenhuma publicação remota foi feita nesta entrega.
