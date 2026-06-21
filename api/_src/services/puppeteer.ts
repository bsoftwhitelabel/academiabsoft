import puppeteer, { type Browser, type Page } from "puppeteer"

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
]

// Opções de PDF partilhadas (iguais às usadas em /generate e /generate-mass).
const PDF_OPTS = {
  format: "A4" as const,
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
}

// Chromium LOCAL (puppeteer traz um build próprio). Sem browser remoto,
// sem dependência externa paga. --no-sandbox para correr em containers.
export async function withPage<T>(
  fn: (page: Page) => Promise<T>
): Promise<T> {
  const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS })
  try {
    const page = await browser.newPage()
    return await fn(page)
  } finally {
    await browser.close()
  }
}

// 1 browser partilhado para gerar N PDFs (ZIP do dossier). O caller
// controla a concorrência (p-limit) e abre 1 page por item.
export async function withBrowser<T>(
  fn: (browser: Browser) => Promise<T>
): Promise<T> {
  const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

// Renderiza 1 PDF (buffer) a partir de HTML, numa page própria.
export async function renderPdfBuffer(
  browser: Browser,
  html: string,
  footerHtml: string
): Promise<Buffer> {
  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({ ...PDF_OPTS, footerTemplate: footerHtml })
    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}
