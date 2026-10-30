# Restaurar scripts — v15

O erro `Cannot find module .../scripts/validate-content.js` significa que o arquivo não está no caminho esperado. O build para antes de validar o conteúdo ou compilar a home.

Este pacote contém a pasta scripts completa da versão v14, incluindo validate-content.js, build-projects.js, markdown-notes.mjs e finalize-site.mjs. Ele repõe os arquivos de build sem alterar os estudos, os textos, as notas ou a pasta src.

## Aplicar no Mac

Salve o ZIP em Downloads e execute:

```sh
cd /Users/julianboledi/Documents/GitHub/stargaze
unzip -o /Users/julianboledi/Downloads/stargaze-restaurar-scripts-v15.zip -d .
npm run build
```

O unzip copia os arquivos para dentro da pasta existente. Arquivos com o mesmo nome são atualizados; outros arquivos não são removidos. Não substitua a pasta scripts inteira pelo Finder.

Se salvou o ZIP em outro lugar, ajuste somente o caminho do ZIP no comando. Os arquivos precisam terminar em `stargaze/scripts/validate-content.js` e `stargaze/scripts/finalize-site.mjs`, sem outra pasta scripts dentro.

Depois de um build bem-sucedido, confira com `npm run preview` e faça commit/push pelo seu fluxo habitual.

Este reparo pressupõe que o restante da correção v14 está no repositório. Se surgir erro apontando outro arquivo ausente fora de scripts, envie o novo erro ou um ZIP da fonte atual, sem node_modules e sem dist: será preciso conferir se outras pastas também ficaram incompletas. Não recopie um estudo antigo sobre seu Swiss Made atualizado.
