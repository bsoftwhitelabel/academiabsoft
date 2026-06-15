import { writeFileSync } from "node:fs"
import { DGERT_LOGO_BASE64 } from "../src/templates/_shared.js"
import { withPage } from "../src/services/puppeteer.js"

const html = `<body style="margin:0;background:#fff;padding:20px">
<div style="width:520px;height:113px;border:1px solid #ddd">
<img src="${DGERT_LOGO_BASE64}" style="width:100%;height:100%;object-fit:contain"/>
</div></body>`

await withPage(async (p) => {
  await p.setViewport({ width: 560, height: 170, deviceScaleFactor: 3 })
  await p.setContent(html, { waitUntil: "networkidle0" })
  writeFileSync("_out/dgert_zoom.png", await p.screenshot({ type: "png" }))
  console.log("_out/dgert_zoom.png written")
})
