import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import nunjucks from "nunjucks";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const OUTPUT_ROOT = path.join(ROOT, "output");

const DATA_PATH = path.join(ROOT, "data", "sample.invoice.json");
const STYLE_PATH = path.join(ROOT, "styles", "invoice.css");
const TEMPLATE_ROOT = path.join(ROOT, "templates");

const templateEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(TEMPLATE_ROOT), {
  autoescape: true
});

export function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function formatMoney(value, currency) {
  const numeric = Number.parseFloat(String(value));
  return `${currency} ${numeric.toFixed(2)}`;
}

templateEnv.addFilter("format_date", formatDate);
templateEnv.addFilter("format_money", formatMoney);

export async function loadInvoiceData(dataPath = DATA_PATH) {
  const raw = await fs.readFile(dataPath, "utf8");
  return JSON.parse(raw);
}

export async function loadStylesheet(stylePath = STYLE_PATH) {
  return fs.readFile(stylePath, "utf8");
}

export async function renderInvoiceHtml(data) {
  const invoiceData = data ?? (await loadInvoiceData());
  const css = await loadStylesheet();

  return templateEnv.render("invoice.html.njk", {
    css,
    ...invoiceData
  });
}

export async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

export async function writeOutputFile(filePath, contents) {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, contents);
  return filePath;
}

export function outputPath(...segments) {
  return path.join(OUTPUT_ROOT, ...segments);
}

function firstExistingPath(candidates) {
  return candidates.find((candidate) => candidate && existsSync(candidate));
}

export function resolvePdfMakeFonts() {
  const normal =
    firstExistingPath([
      process.env.PDFMAKE_FONT_NORMAL,
      "/System/Library/Fonts/Supplemental/Arial.ttf",
      "/Library/Fonts/Arial.ttf"
    ]) ?? "";

  const bold =
    firstExistingPath([
      process.env.PDFMAKE_FONT_BOLD,
      "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
      "/Library/Fonts/Arial Bold.ttf"
    ]) ?? normal;

  const italics =
    firstExistingPath([
      process.env.PDFMAKE_FONT_ITALIC,
      "/System/Library/Fonts/Supplemental/Arial Italic.ttf",
      "/Library/Fonts/Arial Italic.ttf"
    ]) ?? normal;

  const bolditalics =
    firstExistingPath([
      process.env.PDFMAKE_FONT_BOLDITALIC,
      "/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf",
      "/Library/Fonts/Arial Bold Italic.ttf"
    ]) ?? bold;

  if (!normal) {
    throw new Error(
      "Unable to locate a TTF font for pdfmake. Set PDFMAKE_FONT_NORMAL to a valid font path."
    );
  }

  return {
    normal,
    bold,
    italics,
    bolditalics
  };
}
