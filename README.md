# Stargaze — publicação

Versão Equilíbrio preparada para publicar na raiz de `stargaze.glitchme.art`. Veja **PUBLICAR.md** para atualizar o repositório existente e **TEXTOS-DO-SITE.md** para a edição dos textos.

O arquivo `public/CNAME` contém o domínio de produção. A home principal permite indexação; `/design-studies/` conserva os estudos de layout com `noindex`.

The site is a static, GitHub Pages-ready portfolio for data visualization, 3D, live browser tools and creative-code work.

## Run locally

```bash
npm install
npm run dev
```

## Content structure

- `content/projects/` contains the larger cases shown in **Selected work**.
- `content/sketches/` contains live tools and planned experiments shown in **Live lab**.
- `content/backlog/` preserves future ideas without publishing them on the homepage.
- `public/studies/` can hold a complete self-contained study that should live inside this repository.
- `src/main.js` contains the shared portfolio interface and the automatic sketch loader.
- `src/sketches/` contains self-contained inline experiments.

## Nova direção — Equilíbrio

A evolução aprovada abre em `/`. A home anterior está preservada como fonte em `archive/home-before-equilibrium.html`. Os estudos de layout continuam em `/design-studies/`.

A exposição usa um destaque à esquerda e dois estudos à direita; a área inteira de cada card abre seu popup. O cursor contextual aparece somente com mouse. A nova home e os popups têm PT/EN, com bandeiras no rodapé e escolha manual persistente. Sem escolha salva, a consulta de país por IP usa `https://get.geojs.io/v1/ip/country.json` (GeoJS, sem chave), com timeout de 2,5 s e fallback ao idioma do navegador. Nenhum GPS é solicitado. O país fica em cache só na sessão; a escolha manual sempre prevalece, inclusive se a consulta responder depois. Não são reescritos textos autorais nem traduzidos automaticamente os experimentos externos ou o arquivo histórico de layouts.

- `content/home.json`: seleção editorial, capas e estado das pesquisas na nova home.
- `src/visual-fields.js`: motor único para capas monocromáticas e quatro cenas interativas do hero, com pausa, redução de movimento e suspensão fora da área visível. A abóbada aparece somente na capa de Celeste. Os nós usam molas amortecidas para retornar à formação depois de soltos.
- `content/notes/`: textos autorais aprovados, em JSON. Veja o contrato no README dessa pasta.
- Caderno local: `npm run editor` abre o editor separado em `http://127.0.0.1:4318`, com rascunhos no disco, texto, imagens e vídeos. Gera um ZIP com página HTML, mídias e metadados para a home. Veja **CADERNO-LOCAL.md**. O editor não faz parte do site público e não publica online.

O build inclui somente notas `published`. `draft` e `ready` ficam fora do bundle. Nenhum ensaio é gerado para preencher a seção. A autoria e o corpo dos textos devem permanecer intactos na integração.

Life Threads permanece pausado; Lissajous e Chromascope estão integrados como instrumentos inline. Music Box abre o módulo já existente; a capa sequencial é um estudo para a evolução visual, não uma alteração do sequenciador original.

The site regenerates its content list whenever `npm run dev` or `npm run build` runs. Do not edit `src/projects.generated.js` directly.

## Add a larger case study

1. Duplicate `content/templates/project.example.json` into `content/projects/`.
2. Rename it with a short slug, for example `climate-atlas.json`.
3. Update the title, text, tools, date, accent, size and visual.
4. Choose one publication route for `href`:
   - A separate repository or existing site: use the complete `https://...` URL.
   - A self-contained HTML study in this repository: put its files in `public/studies/climate-atlas/` and use `"href":"./studies/climate-atlas/"`.
5. Run `npm run dev` to review it.

For Three.js, D3 or projects with their own build process, a separate repository is usually cleaner. The portfolio then acts as the editorial entry point and links to that deployment. Small HTML/CSS/JS studies can comfortably live under `public/studies/`.

Supported accents: `amber`, `violet`, `blue`, `sage`, `aqua`.

Supported spans: `standard`, `wide`, `tall`.

Supported case visuals: `network`, `wave`, `threads`, `field`, `migration-globe`.

## Add a planned sketch

1. Duplicate `content/templates/sketch.example.json` into `content/sketches/`.
2. Use `"status":"planned"` to create a designed placeholder.
3. List the intended interface controls in `controls`.

## Add a live inline sketch

1. Add `src/sketches/your-sketch.js` following the module contract in `AI-WORKFLOW.md`.
2. Add `content/sketches/your-sketch.json` with `"status":"live"` and `"sketch":"your-sketch"`.
3. Run `npm run dev` to review it.

The loader discovers the JavaScript file automatically. New sketches no longer require manual edits in `src/main.js`.

An existing standalone browser tool may also appear in **Live lab** by using `"status":"live"` with a complete `"href":"https://..."` instead of a local sketch module. String Tuner follows this route.

Pattern Composer, Poster Generator and Data Glyphs are preserved in `content/backlog/` and are not shown publicly until they have a functional prototype.

For the repeatable AI-assisted update and publishing procedure, see [`AI-WORKFLOW.md`](./AI-WORKFLOW.md).

## Publish homologation

Create a separate repository named `stargaze-homolog`. The included GitHub Actions workflow builds and publishes this test environment whenever its `main` branch is updated. In that repository's settings, set Pages source to **GitHub Actions**.

Do not connect a custom domain. The expected address is the repository's own GitHub Pages URL, such as `https://USERNAME.github.io/stargaze-homolog/`.

Only port an approved direction back to the production repository after review.
### Lissajous

O instrumento abre dentro do popup, como a Music Box, pelo módulo `src/sketches/lissajous.js` e pelos metadados `content/sketches/lissajous.json`. A versão integrada usa campo monocromático e controles compactos. Seu código está em `src/instruments/lissajous/`: portado do Lissajous Observatory (revisão `08dcb20`), preservando desenho, áudio, volume e controles. React e os componentes são carregados sob demanda ao abrir o instrumento; a home continua em JavaScript nativo. O componente é isolado em Shadow DOM e desmontado ao fechar ou navegar entre estudos, liberando áudio, animação e eventos. `instrument.css` é o estilo compilado preservado dessa versão; a aparência interna fica em `inline.css`. A rota independente anterior é preservada para links existentes.

O contexto e as referências, em PT/EN, são editáveis em `content/lissajous-context.json`. A referência original é *Mémoire sur l’étude optique des mouvements vibratoires*, Jules Lissajous, 1857, Annales de Chimie et de Physique, série 3, tomo 51, pp. 147–231 (Gallica/BnF). A ficha usa a mesma fonte editorial da página do instrumento.

Nos popups, as setas próximas ao fechar e ←/→ percorrem a coleção em ciclo. Inputs, seletores e controles de instrumentos preservam as próprias teclas.

## Instrumentos — v03 (14/09/2026)

Chromascope agora é um sketch live local: edite `src/instruments/chromascope/instrument.tsx` e `inline.css`; o adaptador `src/sketches/chromascope.js` monta e desmonta React em Shadow DOM. O Site original continua em https://chromascope.stargazeyuri.chatgpt.site, com a mesma implementação em `app/chromascope.tsx` e `app/scope.css`. Sincronize essas cópias; o portfólio não depende desse endereço privado.

O Music Box ocupa um quadrado e mantém seus controles dentro dele. No Lissajous, mudar a fase reposiciona o rastro já percorrido; velocidade inicial inline de 2×.

Verificação adicional: `node scripts/check-inline-instruments.mjs` (handlers, estado e Canvas simulado; não substitui revisão visual/sonora).

## Chromascope — v05 (16/09/2026)

A interação usa uma placa de desenhos e simetrias, sem giro físico contínuo. Arrastar transforma a imagem e soltar fixa o resultado. Compor permite desenhar, selecionar, mover, editar pontos, mudar cor/material/tamanho e apagar; Ver reflexos mostra a composição. Inclui exemplo editável, cores automáticas, 2–12 eixos, desfazer e exportação PNG 2048 × 2048.

Sincronizar `src/instruments/chromascope/optics.ts` com `app/optics.ts` do Site original, além do componente e CSS. O renderizador só agenda frames ao mudar algo e o cleanup libera observadores, frames e URLs temporárias. As formas não são salvas entre sessões. Entrega completa: `stargaze-2026-09-16-v05.zip`.

## Chromascope — v06 (16/09/2026)

Giro com inércia suave e desaceleração até parar. Toque na lente para interromper; edição, desfazer e salvar também param o movimento. O controle radial Traço alterna Auto (reconhecimento de círculos/polígonos), Retas (segmentos) e Livre (suavização de contornos orgânicos). O ajuste ocorre ao soltar o desenho.

Novo módulo `src/instruments/chromascope/drawing.ts`, espelhado em `app/drawing.ts` do Site. Verificação geométrica e de amortecimento: `node scripts/check-drawing-assist.mjs`. Entrega completa: `stargaze-2026-09-16-v06.zip`.

## Chromascope e portfólio — v07 (17/09/2026)

Compor / Visualizar agora são modos permanentes com seleção destacada. Mover / Pausar oferece deslocamento e giro sutis das peças menores; respeita redução de movimento, pausa, exportação e desfazer. O popup limita o quadrado pela altura disponível e mantém navegação visível. O código segue espelhado no Site independente.

O plano do próximo ciclo, com escrita autoral, etapas de aprovação e roteiro Swiss Viz, está em `PLANO-PORTFOLIO-STARGAZE-v01.md`. O documento é privado de trabalho; não foi adicionado às publicações do site. Pacote completo: `stargaze-2026-09-17-v07.zip`.

## v08 — identidade do hero e cartelas estáveis, 17/09/2026

Chromascope parte de três polígonos (quadrilátero, triângulo e quadrado) com preenchimentos translúcidos e contornos finos, em verde-sálvia. A paleta inicial usa tons do hero; âmbar distingue Compor. Materiais, cores automáticas, desenho assistido, inércia e movimento suave permanecem. Esta decisão substitui a preferência anterior por peças sem contorno.

Na home Equilíbrio, iniciar Chromascope, Lissajous ou Music Box substitui apenas a capa quadrada: preserva largura do popup, texto, botão e ordem responsiva, sem reiniciar a rolagem. No celular, a descrição continua acima. Lissajous ganha Ajustar/Fechar ajustes com painel rolável dentro do quadrado; Escape fecha o painel e devolve foco ao botão. Music Box usa DM Mono e Instrument Serif, como o site.

Validação: builds de produção, testes de instrumentos, desenho assistido, movimento e navegação; renderização Canvas inspecionada. Não houve validação em navegador ou reprodução de áudio nesta rodada. Entrega completa: stargaze-2026-09-17-v08.zip. O Site Chromascope é atualizado no endereço existente; publicação do portfólio via GitHub Pages permanece com o usuário.
