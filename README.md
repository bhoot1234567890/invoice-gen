# Invoice Renderer PoCs

This repo contains one shared invoice data model and seven proof-of-concept renderers for print-oriented invoices.

Implemented approaches:

- HTML/CSS + Playwright
- HTML/CSS + Puppeteer
- HTML/CSS + WeasyPrint
- Typst
- QuestPDF
- React-pdf
- pdfmake

## Shared structure

- `data/sample.invoice.json`: reusable example invoice payload with fictitious data only
- `templates/invoice.html.njk`: shared HTML invoice template
- `styles/invoice.css`: shared print-first CSS
- `output/`: generated previews and PDFs, ignored by Git

## Install

Node dependencies:

```bash
npm install
```

Python dependencies:

```bash
python3 -m pip install -r requirements.txt
```

Playwright browser bootstrap:

```bash
npm run bootstrap:playwright
```

## Generate output

HTML preview:

```bash
npm run render:html
```

Playwright PDF:

```bash
npm run pdf:playwright
```

Puppeteer PDF:

```bash
npm run pdf:puppeteer
```

React-pdf PDF:

```bash
npm run pdf:react-pdf
```

pdfmake PDF:

```bash
npm run pdf:pdfmake
```

WeasyPrint PDF:

```bash
python3 python/render_weasyprint.py
```

Typst PDF:

```bash
typst compile --root . typst/invoice.typ output/typst/invoice.typst.pdf
```

QuestPDF PDF:

```bash
DOTNET_ROOT="/opt/homebrew/opt/dotnet/libexec" dotnet run --project questpdf/InvoicePoc
```

## Notes

- Playwright, Puppeteer, and WeasyPrint all target the same HTML/CSS structure, which makes them the closest visual comparison.
- The WeasyPrint script auto-configures `DYLD_FALLBACK_LIBRARY_PATH` and a writable fontconfig cache on macOS so the Homebrew libraries are picked up without extra shell setup.
- `pdfmake` on Node needs local TTF font files. The script tries common macOS Arial locations first. Override with `PDFMAKE_FONT_NORMAL`, `PDFMAKE_FONT_BOLD`, `PDFMAKE_FONT_ITALIC`, and `PDFMAKE_FONT_BOLDITALIC` if needed.
- Typst and QuestPDF are intentionally separate implementations so you can compare authoring style and maintenance tradeoffs, not just output.
- Do not commit real invoice data, personal details, bank details, or generated PDFs. Keep fixtures fictitious.
