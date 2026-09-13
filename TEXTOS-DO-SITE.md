# Editar os textos da Stargaze

Para escrever novas notas, artigos e ensaios, abra o caderno com `npm run editor`. O guia `CADERNO-LOCAL.md` explica o salvamento, imagens, vídeos e o ZIP de publicação.

Para ajustar a apresentação do site no VS Code:

- **Home em português:** textos visíveis em `index.html`. Edite as frases e mantenha as tags, classes e identificadores.
- **Home em inglês:** traduções em `src/site-language.js`, no bloco `staticCopy`.
- **Apresentação dos projetos em português:** campos `category` e `summary` em `content/home.json`.
- **Apresentação dos projetos em inglês:** bloco `projectEnglish` em `src/site-language.js`, na ordem categoria, resumo e estado.

Depois de editar, execute `npm run dev` e abra o endereço mostrado no terminal. A home Equilíbrio já abre na raiz `/`.

Para publicar, siga `PUBLICAR.md`. O caderno local e seus rascunhos não entram na publicação.
