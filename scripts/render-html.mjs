import { outputPath, renderInvoiceHtml, writeOutputFile } from "./lib/invoice-data.mjs";

const html = await renderInvoiceHtml();
const destination = outputPath("html", "invoice.preview.html");

await writeOutputFile(destination, html);

console.log(`HTML preview written to ${destination}`);
