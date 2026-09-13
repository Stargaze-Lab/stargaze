# Stargaze — caderno local

O caderno roda apenas no computador. A home contém somente a leitura das notas publicadas.

## Abrir no Mac

1. Extraia o ZIP e abra a pasta no VS Code.
2. No terminal dessa pasta, execute `npm run editor` (Node.js 22 ou mais recente).
3. Abra **http://127.0.0.1:4318** no navegador do computador. Mantenha o terminal aberto durante a escrita; Ctrl+C encerra o caderno.

O editor não precisa instalar pacotes nem conectar contas. Escreva, use os botões de formatação e adicione imagens ou vídeos. A prévia acompanha o texto. Os rascunhos são salvos automaticamente no disco; confira a mensagem “Salvo neste computador” antes de fechar. “Salvar agora” permite repetir o salvamento após um erro.

Mídias: PNG, JPEG e WebP até 12 MB; MP4 e WebM até 50 MB, com codecs compatíveis com o navegador. Não há conversão automática de vídeos. Até 20 mídias e 200 MB por publicação. Descrições são obrigatórias para exportar. Legendas são opcionais. “Inserir no texto” coloca a mídia na posição do cursor; sem esse marcador, ela aparece ao final. “Retirar da nota” não apaga o arquivo do disco.

## Preparar e publicar

1. Revise a prévia e clique em **Gerar publicação**.
2. O ZIP contém `public/notes/<endereço>/index.html`, as mídias e `content/notes/<endereço>.json`. A página HTML abre diretamente no computador.
3. Extraia o ZIP na raiz da cópia de revisão do site, unindo as pastas `content` e `public`.
4. Execute `npm ci` se as dependências ainda não estiverem instaladas e depois `npm run build`.
5. Publique pelo fluxo de `PUBLICAR.md`, após revisar. A home em `/` passa a listar a nota, que também ganha uma página em `/notes/<endereço>/`.

O botão gera o pacote; não envia nada ao site nem acessa GitHub. Ao revisar uma nota publicada, conserve o campo “Endereço da nota”. Extrair um novo pacote com o mesmo endereço substitui aquela publicação: mantenha uma cópia anterior se precisar desfazer.

## Guardar e recuperar

Os rascunhos e suas mídias ficam em `.stargaze-editor/`, dentro desta pasta do projeto. Faça backup dessa pasta inteira; ela não entra no Git nem no build. No Finder, Command+Shift+. mostra pastas ocultas. Não descarte a pasta antiga ao trocar de versão do projeto: copie `.stargaze-editor/` para a nova pasta antes de abrir o editor.

O botão “Importar JSON anterior” aceita as notas exportadas pelo antigo caderno do navegador. Ele cria um novo rascunho e preserva título, autoria, texto e imagens. Rascunhos que existam apenas no armazenamento do navegador antigo não são transferidos automaticamente para localhost.

O caderno é para uso no computador. O preview privado da Stargaze continua acessível no celular; o endereço 127.0.0.1 no celular não aponta para seu Mac.
