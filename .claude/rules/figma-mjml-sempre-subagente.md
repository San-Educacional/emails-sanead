# figma-para-mjml: sempre subagente + loop de fidelidade

Ao usar a skill **`figma-para-mjml`** (implementar um design do Figma como `.mjml`
deste repo), o fluxo com subagente e a revisão iterativa são **obrigatórios** —
inclusive para **um único e-mail**, não só para sequências.

## Regra

1. **O orquestrador não escreve o `.mjml`.** Ele extrai o design (Figma MCP),
   baixa/otimiza e sobe as imagens no `imghost`, e escreve uma **spec** no
   scratchpad (paleta, escala tipográfica, paddings = literais do design, textos,
   href de CTA, armadilhas de media query).

2. **Um subagente Implementador escreve o arquivo** a partir da spec. Ele
   **não abre Figma MCP nem navegador** (economiza contexto e RAM). Compila até
   sair sem warnings — mas **com times em paralelo, compila SÓ o próprio arquivo**
   (`node -e` com o pacote `mjml`, escrevendo o próprio `.html`), nunca
   `bun run build` (que recompila tudo e dá corrida no `dist/`).

3. **A revisão visual é obrigatória — e NÃO é feita no contexto do orquestrador
   quando há várias peças.** Renderiza o HTML a **393px**, compara **lado a lado**
   com o print do node (`get_screenshot`) e roda `overflow.mjs <html> 375`
   (scrollWidth == 375).
   - **Uma peça:** o orquestrador pode revisar direto.
   - **Várias peças (sequência):** **não revise todas no seu próprio contexto.**
     O Figma MCP é gordo em token; empilhar N peças no mesmo contexto incha e faz
     alucinar — já gerou "declarei fiel" sem estar. Use **um time de QA por
     e-mail, em paralelo** (ver abaixo).

4. **Itera até ficar fiel** via `SendMessage` (deltas objetivos: padding X,
   largura Y, quebra Z, URL de herói nova). Não declara pronto no primeiro corte —
   só depois de conferir o comparativo render-vs-Figma.

5. **Honestidade na entrega:** se sobrar delta (métrica de fonte, ±px de altura,
   overlay omitido por segurança de cliente), aponte explicitamente em vez de
   dizer "pixel perfect".

## QA em paralelo — um time por e-mail

Cada time = **líder revisor (Opus)** + **implementador (Sonnet)** que o próprio
líder spawna, com escopo de **UM** e-mail:

- O líder puxa **só o SEU nó** do Figma (`get_screenshot` alta-res), renderiza o
  SEU HTML a 393px, compara em full-res + **recortes**, roda overflow 375.
- **Herói cortado/mal-enquadrado é o delta mais comum** → o líder **re-corta da
  fonte original + re-sobe no `imghost`** e passa a URL nova ao implementador.
- Deltas de MJML → o líder manda a lista objetiva ao seu implementador, que edita
  e **compila só o próprio arquivo**. Loop líder↔implementador até fiel; devolve
  um **resumo curto** ao orquestrador (não o dump visual).
- O orquestrador só orquestra e faz a checagem mecânica final (build limpo,
  overflow 375, URLs de herói 200, contact-sheet de miniaturas pra pegar troca de
  imagem). Não re-revisa peça a peça no próprio contexto.

### Armadilhas do paralelismo (todas já morderam)

- **Arquivos de saída com nome único no scratchpad, nunca `/tmp/foo.png`
  genérico** — times paralelos colidem e um sobrescreve o comparativo do outro.
- **Um Chrome por vez dentro do time** (o `shot.mjs` abre e fecha). Não dispare
  renders em paralelo dentro do mesmo time.
- **`get_screenshot` sob paralelismo às vezes devolve a peça de OUTRO nó**
  (seleção/estado compartilhados no app do Figma) — cruze com o screenshot bruto
  + a spec antes de confiar no que veio.
- Prefira a fonte de herói de **maior resolução** (não a quadrada de 600px quando
  existir uma landscape) e re-corte no enquadramento do design.

## Por quê

Fazer sozinho e declarar pronto sem conferir o render contra o design gera peça
divergente (paddings largos, caixas esticadas, quebras erradas, **heróis cortados
pela metade**). E revisar N peças no próprio contexto — além de inchar — leva a
over-claim ("fiel") por não olhar em full-res. O loop render-a-393 + comparar +
corrigir, distribuído em **um time por peça**, é o que garante fidelidade sem
estourar contexto. Ver também `.claude/skills/figma-para-mjml/SKILL.md` (pipeline
e armadilha de media query) e `.claude/rules/imagens-via-imghost.md`.
