# emails-sanead

Repositório para desenvolvimento de templates de e-mail da Sanead usando [MJML](https://mjml.io/).

## 🚀 Como usar

### Instalação

Instale as dependências do projeto:

```bash
bun install
```

### Desenvolvimento

Para desenvolver templates de e-mail com compilação automática ao salvar:

```bash
bun run watch
```

Este comando monitora alterações em arquivos `.mjml` dentro da pasta `src/` e compila automaticamente para HTML na pasta `dist/`, mantendo a estrutura de diretórios e o nome dos arquivos.

### Build

Para compilar todos os templates uma única vez:

```bash
bun run build
```

### Limpeza

Para remover todos os arquivos compilados:

```bash
bun run clean
```

## 📁 Estrutura do Projeto

```
emails-sanead/
├── src/              # Templates MJML (arquivos .mjml)
│   └── *.mjml
├── dist/             # Templates compilados (HTML)
│   └── *.html        # (gerados automaticamente, não commitados)
└── scripts/          # Scripts de build
    └── mjml-build.mjs
```

## ✍️ Desenvolvendo Templates

1. Crie ou edite arquivos `.mjml` dentro da pasta `src/`
2. Execute `bun run watch` para compilação automática
3. Os arquivos HTML correspondentes serão gerados em `dist/` com o mesmo nome e estrutura de pastas
4. Abra os arquivos HTML no navegador para visualizar o resultado

### Exemplo

- Arquivo fonte: `src/helloworld.mjml`
- Arquivo compilado: `dist/helloworld.html`

Para templates organizados em subpastas:
- Arquivo fonte: `src/campanhas/promo.mjml`
- Arquivo compilado: `dist/campanhas/promo.html`

## 📚 Documentação MJML

Para aprender mais sobre MJML e seus componentes, visite a [documentação oficial](https://documentation.mjml.io/).
