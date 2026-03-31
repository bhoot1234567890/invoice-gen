import puppeteer from "puppeteer";

import { ensureDirectory, outputPath, renderInvoiceHtml } from "./lib/invoice-data.mjs";

const html = await renderInvoiceHtml();
const destination = outputPath("puppeteer", "invoice.puppeteer.pdf");

await ensureDirectory(outputPath("puppeteer"));

const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: destination,
    printBackground: true,
    preferCSSPageSize: true
  });

  console.log(`Puppeteer PDF written to ${destination}`);
} finally {
  await browser.close();
}
