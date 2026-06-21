// Teste local de render (sem BD): produz os 2 PDFs para validação visual.
// Temporário — apagar após validação.
import { mkdirSync, writeFileSync } from "node:fs"
import { renderChecklist } from "../_src/templates/checklist.js"
import { renderFichaIdentificacao } from "../_src/templates/ficha-identificacao.js"
import { withPage } from "../_src/services/puppeteer.js"

mkdirSync("_out", { recursive: true })

const checklist = renderChecklist({
  courseName: "Higiene e Segurança no Trabalho",
  durationHours: 35,
  actionCode: "HST-2026-014",
  startDate: "2026-06-01",
  endDate: "2026-06-20",
  localFormacao: "Porto — Sala 2",
  tipologiaHorario: "Pós-laboral",
  trainers: ["Ana Martins", "João Sousa"],
  clientName: "Metalúrgica Douro, Lda.",
  clientLogoUrl: null,
  tenantName: "Academia Oporto Forte",
  tenantLogoUrl: null,
  dgertLogoUrl: null,
  generatedAt: new Date().toISOString(),
})

const ficha = renderFichaIdentificacao({
  traineeName: "Maria Fernanda Albuquerque",
  courseName: "Higiene e Segurança no Trabalho",
  actionCode: "HST-2026-014",
  clientName: "Metalúrgica Douro, Lda.",
  clientLogoUrl: null,
  tenantName: "Academia Oporto Forte",
  tenantLogoUrl: null,
  generatedAt: new Date().toISOString(),
})

await withPage(async (page) => {
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })
  for (const [name, r] of [
    ["checklist", checklist],
    ["ficha", ficha],
  ] as const) {
    await page.setContent(r.html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: r.footerHtml,
      margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
    })
    writeFileSync(`_out/${name}.pdf`, pdf)
    const png = await page.screenshot({ fullPage: true, type: "png" })
    writeFileSync(`_out/${name}.png`, png)
    console.log(`_out/${name}.pdf -> ${pdf.length} bytes; _out/${name}.png`)
  }
})
