# Imagens dos e-mails: sempre via skill `imghost`

Toda imagem que for parar num `.mjml` precisa ser **hospedada remotamente antes**
de ser referenciada. O upload é feito **exclusivamente** pela skill `imghost`.

## Regra

1. Recebeu uma imagem (arquivo local, print, ou URL de terceiro) para usar num
   e-mail → suba pela skill `imghost` primeiro.
2. Use a URL pública devolvida pela skill no `<mj-image src="...">`.
3. **Nunca** copie o arquivo para dentro do repositório. Nada de `assets/`,
   `src/**/img/`, nem binário commitado — o repo versiona só `.mjml`.
4. Nunca embuta a imagem em base64 (`data:` URI): clientes de e-mail cortam ou
   bloqueiam, e o HTML colado na ferramenta de disparo fica gigante.
5. Nunca linke direto o host de terceiro (Canva, Drive, WhatsApp, CDN de banco
   de imagem). Esses links expiram ou têm hotlink bloqueado e o e-mail quebra
   na caixa de entrada do lead. Espelhe com `imghost from-url` e use a cópia.

## Como chamar

O binário **não está no `PATH`**. Invoque pelo caminho do repo:

```bash
.claude/skills/imghost/bin/imghost upload    caminho/da/imagem.png   # imprime só a URL
.claude/skills/imghost/bin/imghost from-url  https://host/externo.png  # espelha remoto
.claude/skills/imghost/bin/imghost delete    https://imghost.saneducacional.com.br/xxxxx.png
```

Detalhes de flags, limites e config estão em `.claude/skills/imghost/SKILL.md`.

## Cuidados específicos de e-mail

- **Guarde a URL.** O host não tem endpoint de listagem — a URL devolvida é o
  único handle que existe. Sempre mostre ela ao usuário depois do upload.
- **Resize:** só `100 200 400 800 1200 1600` são aceitos (`?w=N`); qualquer
  outro valor devolve HTTP 400. O corpo do e-mail tem `602px`, então `?w=1200`
  é o alvo normal para ficar nítido em tela retina.
- **Sem dedupe:** subir o mesmo arquivo duas vezes gera dois nomes diferentes.
  Reaproveite a URL já existente em vez de re-subir.
- Mantenha `fluid-on-mobile="true"` no `mj-image`, como no resto do repo.

## Legado

E-mails antigos apontam para `https://assets.saneducacional.com.br/emails/<campanha>/...`,
um bucket publicado à parte. **Não mexa nessas URLs** e não tente subir nada
para lá — não há fluxo automatizado para esse bucket. Imagem nova vai para o
`imghost`.
