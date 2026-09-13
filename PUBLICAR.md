# Publicar a Stargaze

Este pacote promove a home Equilíbrio ao endereço principal `/`. Ele mantém os caminhos dos estudos existentes, o caderno local separado, PT/EN e as interações da versão aprovada. O domínio configurado em `public/CNAME` é `stargaze.glitchme.art`.

## Usando seu repositório atual no Mac

1. Guarde um ZIP ou um commit da versão atual antes de copiar os arquivos.
2. Extraia este pacote e **mescle o conteúdo da pasta `stargaze` com a raiz do repositório atual**. Não substitua a pasta inteira: conserve `.git`, seus rascunhos locais, notas próprias e arquivos que você tenha alterado depois do backup enviado em setembro. Se houver alterações posteriores em um arquivo de mesmo nome, compare antes de substituir.
3. No terminal dessa pasta, execute `npm ci` e depois `npm run build`.
4. Execute `npm run preview`. Abra o endereço indicado, confira a home em português e inglês, os popups e os links para Wikiverso, Empires & Colonies e Celeste. No celular, confira também o tamanho dos cards e a rolagem.
5. Faça commit e push no repositório de produção pelo seu fluxo habitual. O workflow **Deploy Stargaze portfolio to Pages** roda ao enviar para `main`; também pode ser iniciado em Actions → Run workflow.
6. Quando o workflow terminar com sucesso, confira `https://stargaze.glitchme.art/`. Nas configurações existentes do Pages, mantenha a publicação por GitHub Actions e o domínio já configurado. Não há necessidade de mudar DNS para atualizar o conteúdo.

O build inclui os estudos das pastas `colony`, `wikiverso`, `string-tuner` e `experimento-01`, além dos arquivos de `public/`. O editor e seus rascunhos ficam fora do resultado publicado. Não envie a pasta de rascunhos ao GitHub.

## Textos e próximos posts

- Textos da home e apresentação dos projetos: veja `TEXTOS-DO-SITE.md`.
- Artigos, ensaios, imagens e vídeos: execute `npm run editor` e siga `CADERNO-LOCAL.md`.
- Um ZIP de nota deve ser mesclado na raiz do projeto; depois, gere e publique o site novamente. A nota passa a aparecer na home.

O layout anterior está guardado como fonte em `archive/home-before-equilibrium.html`. Os estudos antigos de layout continuam em `/design-studies/`, sem indexação e sem chamada na home principal. Nada é publicado no seu GitHub automaticamente por este pacote.
