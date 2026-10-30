# Publicar a Stargaze — v16

A fonte completa está neste pacote. O domínio continua stargaze.glitchme.art. Comece por LEIA-ME-v16.md para testar a pasta separadamente e copiá-la para o repositório sem apagar arquivos.

## Build e publicação

1. Use Node 22, como no workflow do GitHub.
2. Na raiz da pasta, rode `npm ci` e `npm run build`.
3. Rode `npm run preview`. Confira a home PT/EN, o cartão The Label Is Not the Origin, o botão para /studies/swiss-made/ e os instrumentos inline.
4. Faça commit/push pelo fluxo habitual. O workflow Deploy Stargaze portfolio to Pages roda ao enviar para main e publica dist.
5. Aguarde o deploy concluir e confira o site. As configurações de domínio e DNS não precisam ser alteradas.

O comando de build já inclui os estudos estáticos. O workflow não deve copiá-los novamente para dentro das próprias pastas. Dependências instaladas e dist são gerados localmente; não fazem parte do ZIP de fonte.

## Swiss Made

O build atual enviado em 30/out está em `public/studies/swiss-made/`, preservado integralmente. O cadastro do cartão está em `content/projects/switzerland-2050.json` (nome legado), com slug `swiss-made` e título **The Label Is Not the Origin**. A seleção da home está em `content/home.json`.

Para atualizar o estudo no futuro, copie o conteúdo do novo dist do estudo diretamente para `public/studies/swiss-made/`: index.html, assets e data. Não crie uma pasta dist intermediária e não atualize apenas o dist da home, pois ele é recriado a cada build.

A fonte em `study-sources/swiss-made/` foi preservada do envio, mas é anterior ao build atual. Não a recompile sobre a versão atual; use a fonte correspondente à última versão do estudo.

## Field Notes

O fluxo de Markdown está em `field-notes/README.md`. Crie um arquivo `AAAA-MM-DD-slug.md`, acrescente as fotos locais e use `status: published` quando quiser publicar. O build inclui a nota na home e gera sua página. Rascunhos não entram no site publicado.

O editor local continua disponível por `npm run editor`; instruções em CADERNO-LOCAL.md. As notas existentes não devem ser substituídas por modelos vazios.

## Atualizações completas

Ao copiar uma entrega, mescle os arquivos dentro do repositório. Não substitua uma pasta por outra parcial. A v16 já contém toda a estrutura necessária, sem depender dos patches v13, v14 ou v15. Compare alterações feitas depois do ZIP de 30/out antes de sobrescrever arquivos de mesmo nome.
