# Stargaze — contexto para continuar

Atualizado em 14/09/2026. Comece por este arquivo e por AGENTS.md; leia somente os arquivos relevantes à próxima tarefa. O objetivo agora é publicar textos autorais e desenvolver estudos, sem reabrir o redesign geral da home.

## Identidade e decisões aprovadas

Stargaze é um laboratório independente de arte, dados, narrativa e experimentação, de uma dupla com uma pessoa atualmente ativa. O portfólio expressa ideias e opiniões e busca atrair trabalhos autorais. Referências: SchultzSchultz (ferramentas criativas), Poimandres (experimentos diretos) e Giorgia Lupi (narrativas de dados). Refinamento e personalidade, evitando estética genérica. Elementos manuais só quando pertencem ao projeto.

A direção da home é Equilíbrio. Preservar logo, Syne nos títulos, publicações e experimentos. Capas generativas monocromáticas e discretamente animadas, ligadas ao conteúdo. Hero vivo com quatro cenas e navegação por bolinhas; preservar a interação do cardume. A abóbada saiu do hero, mas permanece na capa de Celeste. Nodegraph tem arraste com retorno elástico. Grid responsivo: Wikiverso grande à esquerda e dois estudos empilhados à direita; celular empilha os cards.

Todo card abre um popup. Controles `< × >` com botões circulares, centralizados na barra do popup; no celular, o rótulo fica acima para não colidir. Setas e ←/→ navegam em ciclo; controles dos instrumentos mantêm suas teclas. Texto curto, botão antes das informações secundárias; contexto e referências recolhidos. No celular, apresentação e botão vêm antes da capa.

## Estado nesta entrega

Lissajous é estudo interno, como Music Box: abre no popup, sem sair da home. Campo monocromático com pulso luminoso e rastro que desvanece; inicial 4:5 (tônica/terça maior justa). Preserva notas, frequências livres, trava harmônica, fase, persistência, velocidade inicial 2× e ajuste até 10×, áudio suave e volume. React é carregado sob demanda; estilos isolados em Shadow DOM. Fechar/navegar desmonta animação, observadores e áudio. A rota independente anterior permanece apenas para compatibilidade com links antigos.

PT/EN na home e nos controles. A preferência salva tem prioridade; país estimado por IP tem fallback ao idioma do navegador. Conteúdo autoral não é traduzido automaticamente.

Field Notes recebe registros curtos, ensaios, desenhos, dados e referências. O editor é local: npm run editor. Permite texto, imagens e vídeos e exporta publicações prontas. Nenhuma interface de escrita é exposta no site. Ver CADERNO-LOCAL.md, TEXTOS-DO-SITE.md e PUBLICAR.md.

## Próximos estudos — escolher um por vez

- Wikiverso: preservar o projeto; capa em nodegraph.
- Empires & Colonies: principal narrativa. Próximo trabalho pode reparar globo/países, refinar profundidade e reservar texto autoral e instruções.
- Celeste: manter; capa de estrelas e abóbada.
- Music Box: evoluir para pulso sequencial e grid controlando tempo/altura. A integração atual preserva o instrumento existente.
- Life Threads: pausado até haver banco de eventos maior; não fabricar biografias com LLM.
- Orbit: futura missão Apollo real simplificada; não priorizar versão atual.
- String Tuner: fora da seleção principal.
- Chromascope: agora integrado e live. Quadrado com lente circular, interface radial, modos editar/explorar, desenho com troca automática de cor, seleção e edição de vértices/redesenho, exclusão individual/total, quatro paletas, materiais sólido/vidro/brilho, shake, densidade e 2–12 eixos (4–24 setores). Física preservada do protótipo; colisões aproximadas por círculos. As peças permanecem durante a sessão do instrumento.

## Arquivos e continuidade técnica

- Home: index.html, src/equilibrium.js, src/equilibrium.css, content/home.json.
- Cenas/capas: src/visual-fields.js. Idioma: src/site-language.js.
- Lissajous: content/sketches/lissajous.json, src/sketches/lissajous.js, src/instruments/lissajous/{instrument.tsx,inline.css}. Contexto editável: content/lissajous-context.json.
- Validação: npm run build; scripts/check-project-navigation.mjs, check-lissajous.mjs, check-review.mjs e check-publication.mjs. Nenhum teste visual/sonoro real foi realizado nesta entrega; verificações automáticas não substituem essa revisão.
- Preservar arquitetura Vite, dependências, lockfile e contrato de mount/cleanup. Não criar registro manual de sketches.

## Publicação e segurança

O usuário não quer conceder acesso ao GitHub para LLMs. Entregar ZIP completo para mesclar no repositório existente, preservando alterações posteriores; GitHub Pages publica dist. Domínio público: https://stargaze.glitchme.art/ . Não afirmar que ele foi atualizado sem evidência.

Prévia privada autorizada para atualizações: https://stargaze-home-directions.stargazeyuri.chatgpt.site .
Projeto Sites existente: appgprj_6a9c18c13afc81919c3b28af6e6674e0. Reutilizar esse ID, sem criar outro Site. Checkout: /workspace/sites/stargaze-direction-preview; se ausente, recuperar o repositório interno com a ferramenta Sites. Isso não requer acesso à conta GitHub do usuário.

## Ajuste do Chat 2.0 — 14/09/2026

Navegação atualizada na home e em design-studies: `< × >`, com botões circulares, centralizada, com alvos de 44 × 44 px e foco visível por teclado. No celular, rótulo acima dos controles. Build, check-project-navigation e check-review passaram. Revisão visual em navegador não foi possível neste ambiente (download do navegador indisponível). Nenhuma publicação foi realizada neste ajuste.

## Versionamento das entregas

A partir do Chat 2.0, entregar cada ZIP como arquivo separado no formato `stargaze-AAAA-MM-DD-vNN.zip`, incrementando a versão a cada entrega e preservando as anteriores. A primeira entrega deste chat (sem sufixo) equivale à v01. Entrega atual: `stargaze-2026-09-15-v04.zip` — refinamento visual do Chromascope. v03 e v02 preservadas.

## v03 — instrumentos inline

- Lissajous: fase reposiciona o rastro existente sem reiniciar seu progresso. Arraste contínuo e teclado; velocidade inicial 2×, limite 10× preservado.
- Music Box: quadrado estável com controles internos; texto de apresentação desaparece enquanto o instrumento está aberto. Controles respondem à largura do instrumento.
- Chromascope: `src/instruments/chromascope/{instrument.tsx,inline.css}`, `src/sketches/chromascope.js`, `content/sketches/chromascope.json`. React sob demanda em Shadow DOM, independente do Site privado.
- Fonte original e versão standalone: Site Chromascope existente `appgprj_6a90a6c574948191b92ccffe332d3e07`, https://chromascope.stargazeyuri.chatgpt.site . Checkout `/workspace/sites/chromascope`, arquivos `app/chromascope.tsx` e `app/scope.css`. Sincronizar as duas cópias ao editar.
- Verificações: build, check-project-navigation, check-lissajous, check-review e check-inline-instruments. O último exercita desenho, cores, edição, exclusão, modos, eixos, densidade, física finita, limpeza e continuidade da fase. Testes sem navegador; revisão visual e reprodução de áudio permanecem pendentes.
- GitHub Pages não foi publicado por este chat.

## Mensagem para abrir o próximo chat

“Vamos continuar a Stargaze a partir deste ZIP. Leia CONTINUAR-STARGAZE.md e AGENTS.md. A home Equilíbrio está aprovada; vamos trabalhar apenas no próximo estudo ou texto que eu indicar.”

## Refinamento visual — 15/09/2026

DM Mono regular incorporada localmente (licença OFL), textos menores em arco, limpar como ícone com nome acessível, escalas finas e anéis duplos inspirados em astrolábios. O marcador de rotação acompanha o giro; guias discretas auxiliam o desenho. Área de clique dos controles preservada. Referência: https://www.rmg.co.uk/collections/objects/rmgc-object-10740 .
