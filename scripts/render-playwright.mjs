import { chromium } from "playwright";

import { ensureDirectory, outputPath, renderInvoiceHtml } from "./lib/invoice-data.mjs";

const html = await renderInvoiceHtml();
const destination = outputPath("playwright", "invoice.playwright.pdf");

await ensureDirectory(outputPath("playwright"));

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: destination,
    printBackground: true,
    preferCSSPageSize: true
  });

  console.log(`Playwright PDF written to ${destination}`);
} finally {
  await browser.close();
}
