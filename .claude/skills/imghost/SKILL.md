---
name: imghost
description: Use when the user asks to upload, host, share, or embed a local image (PNG / JPEG / GIF / WebP) on their private image host at imghost.saneducacional.com.br. Returns the public URL and can format it as ready-to-paste Markdown or HTML for docs, READMEs, or chat. Also uploads by remote URL and deletes prior uploads.
---

# imghost

Wraps the operator's private imgpush instance behind a single `imghost` CLI on
`PATH`. Always shell out to the CLI; never craft the HTTP request by hand and
never echo the bearer token.

## When to invoke

- The user wants a shareable URL for a local image ("sobe essa imagem", "hospeda
  esse print", "upload this png")
- Markdown to drop into a `.md` (`![alt](url)`)
- An `<img>` tag for a page
- Mirroring a remote image onto their own host
- Deleting something they uploaded before

If the user pastes an image inline without naming a file, ask for the path —
the CLI uploads from disk (or stdin).

## CLI cheat sheet

| Goal | Command |
|---|---|
| Public URL only | `imghost upload PATH` |
| Markdown tag | `imghost md PATH` |
| HTML `<img>` | `imghost html PATH` |
| Raw JSON response | `imghost upload --json PATH` |
| Mirror a remote image | `imghost from-url https://…` |
| Delete | `imghost delete FILENAME` (or paste the full URL) |
| Check config + host health | `imghost whoami` |

`--alt "..."` overrides alt text on `md`/`html` (defaults to the filename).
`--w N` / `--h N` append a resize query to the returned URL.
`PATH` may be `-` to read bytes from stdin.

## Typical flows

### Screenshot into a markdown doc

```bash
imghost md ~/prints/dashboard.png
# ![dashboard.png](https://imghost.saneducacional.com.br/k3f9a.png)
```

Paste the line as-is.

### Thumbnail-sized embed

```bash
imghost md ~/prints/wide.png --w 400 --alt "visão geral"
# ![visão geral](https://imghost.saneducacional.com.br/p2mza.png?w=400)
```

### Clean up

```bash
imghost delete https://imghost.saneducacional.com.br/k3f9a.png
# {"status":"deleted","cached_files_removed":"2"}
```

## Constraints that will bite

- **Only these resize values work:** `100 200 400 800 1200 1600`. Anything else
  returns HTTP 400 — the whitelist exists so nobody can force arbitrary resizes.
- **Max 20 MB** per file.
- **There is no listing endpoint.** The host has no database; you cannot
  enumerate past uploads. If a link is lost, the file is only findable by
  browsing `/home/self-hosted/imgpush/images/` on the server. So: after an
  upload, always surface the URL to the user — it is the only handle that exists.
- Uploads are not deduped by content; uploading the same file twice yields two
  distinct filenames.

## Output contract

- `upload` and `from-url` print **only** the URL on stdout — pipe them directly.
- `md` / `html` print exactly one line.
- `delete` prints the raw JSON. Errors go to stderr with a non-zero exit
  (`curl --fail-with-body` is on, so 4xx bodies still surface).

## Don't

- Don't print `.env` contents or the bearer token in user-visible output.
- Don't cat binary image bytes to the terminal — pass paths to the CLI.
- Don't hand-roll the curl call; the CLI owns auth and URL construction.

## Config

`IMGHOST_URL` and `IMGHOST_KEY` resolve from the first source that has them:
process env → `$IMGHOST_ENV` → `<skill-dir>/.env` → `~/.config/imghost/.env`.
