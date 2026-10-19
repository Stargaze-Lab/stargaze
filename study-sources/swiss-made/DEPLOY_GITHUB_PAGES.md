# Switzerland 2050 — GitHub Pages subfolder build

Esta cópia da v1.0.1 inclui apenas ajustes de compatibilidade com subpastas. Os gráficos e a narrativa não foram alterados.

## Compilar

Na pasta `site/`:

```bash
npm install
npm run build
```

O resultado estará em `site/dist/`. Vite está configurado com `base: './'`, para funcionar numa pasta como `/studies/swiss-made/`, mesmo em domínio personalizado.

## Publicar dentro do site Stargaze

No repositório da Stargaze, localize a pasta que o GitHub Pages realmente publica (raiz, `docs/`, ou diretório de saída do build, dependendo da configuração).

Crie uma subpasta, por exemplo:

```
studies/swiss-made/
```

Copie **o conteúdo** de `dist/` para ela, mantendo `index.html`, `assets/` e `data/` no mesmo nível:

```
studies/swiss-made/index.html
studies/swiss-made/assets/...
studies/swiss-made/data/...
```

Depois faça o commit e push no repositório Stargaze.

URL esperada, com domínio personalizado:

```
https://SEU-DOMINIO/studies/swiss-made/
```

**Importante:** não publique a pasta `dist` dentro dessa subpasta (`.../switzerland-2050/dist/index.html`). Copie *seu conteúdo*. Se a Stargaze usa um framework/build de site, copie para o local que esse build preserva/publica; arquivos numa pasta de saída gerada podem ser apagados no próximo deploy.

## Checagens pós-publicação

- O site deve abrir a URL terminada em `/`.
- Confira no DevTools > Network que `assets/*.js`, `assets/*.css`, mapas PNG e `stargaze-logo.svg` não retornam 404.
- Teste navegação pelas setas, Network, filtros de Territory e controles do LAB.

## O que foi corrigido para subpastas

- `vite.config.js` usa `base: './'`.
- Caminhos em HTML usam `%BASE_URL%`.
- Caminhos para mapas carregados dinamicamente no JS usam `import.meta.env.BASE_URL`.

O `npm install`/build não foi executado neste ambiente (falha de acesso a `registry.npmjs.org`); rode e confira o build antes de publicar.
