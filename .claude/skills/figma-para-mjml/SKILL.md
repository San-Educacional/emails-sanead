---
name: figma-para-mjml
description: Use when implementing an email design from Figma as MJML in this repo — "implement this design from Figma", a figma.com/design URL, "cria a sequência X a partir do Figma", "monta esse e-mail do Figma". Covers the multi-agent pipeline (Opus extrai o design, Sonnet implementa, Opus revisa), the MJML adaptations that make a designer's mockup survive a real email client, and the visual QA loop with screenshots. Also read it before touching any media query in a .mjml deste repo.
---

# figma-para-mjml

Traduz um design do Figma para um `.mjml` deste repo. O design **sempre** vem
com coisas que não existem em cliente de e-mail; metade do trabalho é decidir o
que vira pixel, o que vira cor sólida e o que é descartado.

Leia junto: `CLAUDE.md`, `.claude/rules/imagens-via-imghost.md` e
`.claude/rules/figma-mjml-sempre-subagente.md`.

## Pipeline com subagentes

**Obrigatório sempre — inclusive para um único e-mail** (ver
`.claude/rules/figma-mjml-sempre-subagente.md`): o orquestrador extrai o design e
escreve a spec, um subagente Implementador escreve o `.mjml`, e o orquestrador
revisa no Playwright (render a 393px vs. print do Figma) e itera via `SendMessage`
até ficar fiel. Não faça sozinho nem declare pronto sem conferir o comparativo.

Por e-mail, duas equipes-de-um em série:

1. **Lead (Opus)** — navega o Figma, baixa e otimiza os JPEG, sobe no `imghost`,
   escreve uma spec em markdown no scratchpad. **Não escreve o `.mjml`.**
2. **Implementador (Sonnet)** — lê só a spec + um `.mjml` já aprovado da mesma
   sequência, escreve o arquivo, roda `bun run build` até zerar warning.
   **Não abre o Figma MCP** — não precisa, e economiza contexto.
3. **Lead (Opus) de novo**, via `SendMessage` no mesmo agente — revisa a
   implementação contra a spec e o design, e corrige ele mesmo o arquivo. O
   contexto do design já está na cabeça dele; respawnar joga isso fora.
4. **Orquestrador** — a conferência visual é sua e centralizada. Proíba os
   subagentes de abrir navegador, senão a RAM vai embora.

**Por que Opus na extração:** o Figma MCP devolve muito token e exige decidir o
que é essencial. Sonnet implementa bem a partir de uma spec pronta, mas se
afoga navegando o design.

**Escreva um `PADRAO.md` no scratchpad antes de soltar qualquer equipe** e mande
todo mundo obedecê-lo acima da própria spec. É onde entram paleta, escala
tipográfica, href de CTA e as receitas abaixo. Quando descobrir uma armadilha
nova, promova pro `PADRAO.md` na hora — as equipes seguintes já nascem imunes.
Segurar a primeira leva (3 de 6) até ela voltar pega erro de instrução antes de
replicá-lo.

## Seletores de media query — a armadilha que não aparece no build

Compila limpo, parece certo no código, e **não faz absolutamente nada**. Já
derrubou 3 e-mails; três equipes independentes chegaram na mesma causa.

| alvo | errado (silenciosamente inócuo) | certo |
|---|---|---|
| texto de `mj-text` | `.classe { font-size }` | `.classe div { font-size: … !important }` |
| padding de `mj-section` | `.classe > tbody > tr > td` | `.classe > table > tbody > tr > td` |
| botão `mj-button` | `.classe { width: 100% }` | `.classe table { width: 100% !important }` **+** `.classe a { display: block !important; width: auto !important }` |

Por quê: `css-class` em `mj-text` cai no `<td>`, e o MJML força `font-size:0px`
nesse `<td>` — o valor real está inline no `<div>` interno. `css-class` em
`mj-section` cai no `<div>` externo, cujo filho é `<table>`, não `<tbody>`. E
`mj-button` vira `<table width:NNN>` + `<a width:MMM>` dentro do td.

⚠️ **O padrão inválido `.classe > tbody > tr > td` está espalhado pelos e-mails
antigos do repo** (veio do `sequenciasecretariado1.mjml`). Se for mexer num
template legado, confira se a media query dele está viva antes de confiar nela.

Ao mirar `.classe div`, cuidado com `<div>` aninhado (caixa com fundo + texto
dentro): o seletor pega os dois níveis. Ponha uma classe no `<div>` certo em vez
de contar níveis.

## Critérios de aceite

```bash
bun run build 2>&1 | grep -i 'issue\|warn\|error'   # tem que sair vazio
node bin/overflow.mjs dist/.../arquivo.html 375     # scrollWidth == 375
```

Um único `width` fixo maior que a tela empurra o corpo inteiro e o e-mail chega
torto no celular. Causas já vistas: botão de CTA com texto longo; `border: 1px`
em duas colunas de um `mj-group` (2px × 2 = 4px de estouro).

## Adaptações que sempre aparecem

| no design | no e-mail |
|---|---|
| degradê sobre foto | componha foto + overlay num único JPEG antes de subir |
| degradê de fundo | cor sólida |
| `rgba()` | achate para hex, calculado sobre a cor de fundo real |
| `box-shadow` / glow | `border: 1px solid` ou nada |
| texto sobre foto | tire o texto da imagem: foto + faixa de cor sólida com `mj-text` |
| elemento em `position:absolute` (pílula, badge) | vira faixa própria acima/abaixo, ou `<span>` com `border-radius:999px` |
| linha conectando itens de timeline | descarte — atravessa fronteira de `mj-section`; a copy sustenta a leitura |
| bolinha/ícone colorido | `<div>` com `background-color` + `border-radius:999px` dentro de `mj-text` (Outlook mostra quadrado; melhor que sumir com imagem bloqueada) |
| `text-transform: uppercase` | escreva em caixa alta direto no MJML |
| ícone vetorial simples | recrie com emoji/cor; não suba imagem |

**Truque do hero full-bleed:** force as últimas linhas de pixel do JPEG para a
mesma cor da seção seguinte. Aí o hero vai sem `border-radius` e sem padding
lateral, encostando nas bordas, e a emenda desaparece. Qualquer margem quebra o
efeito.

**`mj-section` não aninha.** Caixa dentro de card = `<div style="background-color:…;border-radius:…">`
dentro de `mj-text`. Card longo = várias `mj-section` consecutivas de mesmo
fundo, com raio só no topo da primeira e na base da última.

**Fundo: cada seção declara o seu.** Não deixe seção herdar do `mj-body` — o
`background-color` do body pinta o canvas inteiro, inclusive as calhas laterais
no desktop e a sobra abaixo do conteúdo. Se puser cor de rodapé no body, ela
vaza pra peça toda.

## Responsividade

O design costuma vir em 393px (mobile). O arquivo entrega as duas versões:

- **desktop = a canvas de 602px do MJML**, que é o layout padrão;
- **mobile = `@media only screen and (max-width: 480px)`** no `mj-style`,
  com os seletores da tabela acima. Os valores mobile são os literais do Figma.

`fluid-on-mobile="true"` em `mj-image` — **menos no logo**, onde ele estica a
arte até as bordas da tela e parece cortada. Logo leva `width` fixo menor ou
padding lateral na seção.

**Padronize corpo, saudação, botões e rodapé entre os e-mails da sequência; NÃO
padronize o headline do hero.** O design varia o display de propósito (uma peça
de urgência tem headline maior) e achatar tudo numa régua só mata a hierarquia.

## Conferência visual

Instale o Playwright **fora do repo** (não suje o `package.json`) e copie os
scripts de `bin/` para lá. Como são ESM, o `import 'playwright'` resolve a partir
do diretório do próprio script — `NODE_PATH` não funciona, por isso a cópia:

```bash
PW=/tmp/pw
mkdir -p $PW && cd $PW && npm init -y && npm i playwright
cp .claude/skills/figma-para-mjml/bin/*.mjs $PW/
```

Os scripts usam o Chrome do sistema (`channel: 'chrome'`), então **não baixam
browser**. Abrem um de cada vez e fecham — não rode em paralelo, a RAM sofre.
Passe caminho **absoluto** para o HTML:

```bash
node $PW/shot.mjs     "$PWD/dist/.../email.html" 375 /tmp/mobile.png
node $PW/shot.mjs     "$PWD/dist/.../email.html" 700 /tmp/desktop.png
node $PW/overflow.mjs "$PWD/dist/.../email.html" 375
```

Compare com o PNG do node (`get_screenshot` do Figma MCP + `curl`). Para olhar
detalhe sem estourar contexto, recorte a região:
`convert shot.png -crop 700x420+0+1330 +repage crop.png`.

Use viewport de 900px de vez em quando: as calhas laterais só aparecem aí, e é
onde erro de `mj-body` fica visível.

## Don't

- Não use HTML cru para layout. HTML inline só dentro de `mj-text`, e só para
  formatação de texto ou as caixas com fundo/borda.
- Não mude os textos do design — nem para corrigir o que parece erro. Espaço
  duplo, travessão, emoji e caixa alta são intocáveis. `[PRIMEIRO NOME]` vira
  `{$name|default('Estudante')}`; outras `[ASSIM]` viram `{$assim}`.
- Não copie a regra `a[class*="mj-button"] { white-space: nowrap !important; }`
  dos e-mails antigos — quebra CTA de texto longo.
- Não invente `produto`/`fornecedor`/`curso` no href de redirect, e não invente
  copy que o design não tem (gancho pro próximo e-mail, assinatura de rodapé).
  Se o design não tem, pergunte ao usuário.
- Não confie no build como validação de responsividade: ele compila 100% limpo
  com a media query inteira morta.
