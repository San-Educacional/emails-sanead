// uso: node shot.mjs <arquivo.html> <largura> <saida.png>
// Abre UM chrome por vez, tira screenshot de página inteira e fecha.
// Usa o Chrome do sistema (channel: 'chrome') para não baixar browser.
// Larguras úteis: 375 (mobile), 700 (desktop), 900 (para ver as calhas laterais).
import { chromium } from 'playwright'

const [file, widthArg, out] = process.argv.slice(2)
if (!file || !out) {
  console.error('uso: node shot.mjs <arquivo.html> <largura> <saida.png>')
  process.exit(1)
}
const width = Number(widthArg || 602)

const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  })
  await page.goto('file://' + file, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200) // fontes do Google + imagens do imghost
  await page.screenshot({ path: out, fullPage: true })
  const h = await page.evaluate(() => document.body.scrollHeight)
  console.log(`${out} ${width}x${h}`)
} finally {
  await browser.close()
}
