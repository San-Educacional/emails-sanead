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
   **não abre Figma MCP nem navegador** (economiza contexto e RAM) e compila até
   `bun run build` sair sem warnings.

3. **O orquestrador revisa visualmente** com Playwright: renderiza o HTML a
   **393px** e compara **lado a lado** com o print do node do Figma
   (`get_screenshot`). Também roda `overflow.mjs <html> 375` (scrollWidth == 375).

4. **Itera até ficar fiel.** O orquestrador manda correções concretas ao mesmo
   subagente via `SendMessage` (deltas objetivos: padding X, largura Y, quebra de
   linha Z) e refaz o comparativo. Repete até bater com o design. Não declara
   pronto no primeiro corte — só depois de conferir o comparativo.

5. **Honestidade na entrega:** se sobrar algum delta (métrica de fonte, ±px de
   altura), aponte explicitamente em vez de dizer "pixel perfect".

## Por quê

Fazer sozinho e declarar pronto sem conferir o render contra o design gera peça
divergente (paddings largos demais, caixas esticadas, quebras erradas). O loop
render-a-393 + comparar + corrigir é o que garante fidelidade. Ver também
`.claude/skills/figma-para-mjml/SKILL.md` (pipeline e armadilha de media query)
e `.claude/rules/imagens-via-imghost.md`.
