// uso: node overflow.mjs <arquivo.html> <largura>
// Critério de aceite do repo: scrollWidth == largura do viewport em 375px.
// Um único width fixo maior que a tela empurra o corpo inteiro e o e-mail
// chega torto no celular. O build do MJML NÃO pega isso.
import { chromium } from 'playwright'

const [file, widthArg] = process.argv.slice(2)
if (!file) {
  console.error('uso: node overflow.mjs <arquivo.html> <largura>')
  process.exit(1)
}
const width = Number(widthArg || 375)

const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto('file://' + file, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(800)
  const report = await page.evaluate((vw) => {
    const out = []
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (r.width > vw + 1 || r.right > vw + 1) {
        const cs = getComputedStyle(el)
        out.push({
          tag: el.tagName,
          cls: (el.getAttribute('class') || '').slice(0, 40),
          w: Math.round(r.width),
          right: Math.round(r.right),
          cssWidth: cs.width,
          attrWidth: el.getAttribute('width') || '',
          inline: (el.getAttribute('style') || '').slice(0, 90),
        })
      }
    }
    return { scrollWidth: document.documentElement.scrollWidth, offenders: out }
  }, width)
  console.log('scrollWidth:', report.scrollWidth, '| viewport:', width)
  console.log('elementos que estouram:', report.offenders.length)
  // Os primeiros da lista são ancestrais empurrados; o culpado costuma estar
  // no fim — procure width fixo em inline/attrWidth.
  for (const o of report.offenders.slice(0, 25)) console.log(JSON.stringify(o))
} finally {
  await browser.close()
}
