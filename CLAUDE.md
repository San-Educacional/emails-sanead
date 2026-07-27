# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este repositório

Templates de e-mail marketing da **San Educacional**, escritos em [MJML](https://documentation.mjml.io/) e compilados para HTML. Não há aplicação, testes ou lint — o "código" são os arquivos `.mjml` em `src/`, e o único build converte MJML → HTML em `dist/`. O HTML gerado é colado na ferramenta de disparo; `dist/` é gitignorado (exceto `.gitkeep`).

Conteúdo dos e-mails é em **português brasileiro**.

## Comandos

```bash
bun install         # instala dependências
bun run watch       # compila src/**/*.mjml → dist/ ao salvar + servidor em http://localhost:3000 (listagem de diretórios)
bun run build       # compila tudo uma vez
bun run clean       # apaga e recria dist/
```

`bun run watch` é o fluxo normal de desenvolvimento: o servidor expõe `dist/` também no IP da rede local, para abrir o e-mail no celular e conferir a versão mobile. Não existe suíte de testes; validação = compilar sem warnings do MJML (`scripts/mjml-build.mjs` imprime `[mjml] N issue(s)`) e inspecionar o HTML no navegador.

## Estrutura

`src/campanhas/<campanha>/<arquivo>.mjml` → `dist/campanhas/<campanha>/<arquivo>.html`. O build espelha a árvore de `src/` (`scripts/mjml-build.mjs`), então a pasta define a organização por campanha:

- `tecnico-para-tecnologo/` — um e-mail avulso por curso (agronegocio, edificacoes, eletrotecnica, estetica, ...)
- `<curso>-sequencia/` — sequências numeradas (`sequenciaedificacoes1..5`, `sequenciasecretariado1..6`, `sequenciatransacoes1..4`); cada arquivo é um e-mail de um fluxo, e o texto de um faz gancho com o próximo ("No próximo e-mail, vamos...")

Cada `.mjml` é **autocontido** (300–400 linhas): não há `mj-include`, partials nem componentes compartilhados. Ao criar um novo e-mail, copie o arquivo mais próximo da mesma sequência/campanha e edite — é o padrão estabelecido em todo o histórico do repo.

## Convenções obrigatórias dos templates

**Variáveis de merge da plataforma de disparo** (sintaxe Smarty-like, deixe literal no MJML):

- `{$codlead}` — id do lead, sempre presente na querystring dos links de redirect
- `{$name|default('Estudante')}` — saudação; sempre com `default`, nunca `{$name}` sozinho
- `{$unsubscribe}` — href do link "Descadastre-se" no rodapé

**Links de CTA** nunca apontam para o destino final; passam pelo redirect de rastreio:

```
https://mailingredirect.saneducacional.com.br/redirect.php?codlead={$codlead}&amp;produto=14&amp;fornecedor=07&amp;curso=000&amp;nome_produto=...&amp;nome_curso=...
```

Use `&amp;` (não `&`) dentro dos atributos `href`. Os pares `produto`/`fornecedor`/`curso` identificam a campanha — copie-os do e-mail vizinho da mesma sequência em vez de inventar; errar isso quebra o rastreamento e já motivou vários commits de correção.

**Imagens** são todas remotas — nunca há binário no repo (a pasta local `assets/` está vazia). E-mails antigos apontam para `https://assets.saneducacional.com.br/emails/<campanha>/...`, um bucket publicado à parte sem fluxo automatizado; mantenha essas URLs como estão. **Imagem nova sobe pela skill `imghost`** — ver @.claude/rules/imagens-via-imghost.md.

**Layout**: `<mj-body width="602px">` com todo o conteúdo dentro de um `<mj-wrapper padding="0px">`; `mj-head` traz a fonte Poppins do Google Fonts e um `mj-attributes` com defaults de `mj-text`/`mj-button`. Rodapé fixo: bloco de CTA final + assinatura "Atenciosamente, Equipe San Educacional" + divisor + link de descadastro.

**Responsividade**: clientes de e-mail não suportam flex/grid. O padrão do repo é `mj-section`/`mj-column` com `css-class` (`card-section`, `card-item`, `card-centered`, `salary-card`, `cargo-box`) e um bloco `<mj-style>` com `@media only screen and (max-width: 480px)` que força `width: 100% !important; display: block !important` nesses elementos. Use `fluid-on-mobile="true"` em `mj-image`. Sempre valide o mobile — grande parte dos commits `fix:` do repo é responsividade.

## Git

Commits em português, no padrão `feat: adiciona email N da sequência de <curso>` / `fix: corrige ...`. Trabalho feito em branches `feat/sequencia-<curso>` e integrado à `main` via PR no repositório `San-Educacional/emails-sanead`.
