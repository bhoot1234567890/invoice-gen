# Repository Guidelines

## Project Structure & Module Organization
- `data/sample.invoice.json` is the shared invoice payload. Keep field names stable unless all renderers are updated together, and keep fixture values fictitious.
- `templates/` and `styles/` contain the shared HTML/CSS invoice used by Playwright, Puppeteer, and WeasyPrint.
- `scripts/` contains Node entry points for HTML preview, browser PDF generation, React-pdf, and pdfmake. Shared helpers live in `scripts/lib/`.
- `python/render_weasyprint.py` is the Python renderer.
- `typst/invoice.typ` is the Typst template.
- `questpdf/InvoicePoc/` contains the .NET/QuestPDF implementation.
- `output/` holds generated artifacts only. It is ignored by Git and should stay empty in commits.

## Build, Test, and Development Commands
- `npm install` installs Node dependencies.
- `python3 -m pip install -r requirements.txt` installs Python dependencies.
- `npm run bootstrap:playwright` downloads Chromium for Playwright.
- `npm run render:html` writes `output/html/invoice.preview.html`.
- `npm run pdf:playwright`, `npm run pdf:puppeteer`, `npm run pdf:react-pdf`, `npm run pdf:pdfmake` generate PDFs for those renderers.
- `python3 python/render_weasyprint.py` generates the WeasyPrint PDF.
- `typst compile --root . typst/invoice.typ output/typst/invoice.typst.pdf` builds the Typst PDF.
- `DOTNET_ROOT=/opt/homebrew/opt/dotnet/libexec dotnet run --project questpdf/InvoicePoc` builds the QuestPDF output.

## Coding Style & Naming Conventions
- Follow existing formatting: 2 spaces in JSON, CSS, HTML, and `.mjs`; 4 spaces in Python and C#.
- Use ESM for Node scripts and keep helpers in `scripts/lib/`.
- Prefer descriptive file names by renderer, for example `render-playwright.mjs` and `invoice.typ`.
- Keep changes ASCII unless the file already requires non-ASCII characters.
- No formatter or linter is configured; match the surrounding style and keep patches focused.

## Testing Guidelines
- There is no automated test suite yet. Validate changes by rerunning the affected generator command and confirming output in `output/`.
- When changing shared schema or layout, verify at least one HTML/CSS path and one non-HTML path.
- If you add tests later, place them near the relevant implementation and name them after the target module.

## Data Hygiene
- Never commit real customer data, personal contact details, bank details, or generated invoice PDFs.
- Use obviously fictitious placeholders such as `billing@example.com` and generic company names in fixtures and docs.

## Commit & Pull Request Guidelines
- No Git history is available in this workspace, so use short imperative commit messages such as `Add invoice totals to Typst template`.
- PRs should state which renderer(s) changed, list the commands run, and attach updated PDF screenshots or artifacts when layout changes are visible.
- Call out data contract changes explicitly; they usually affect multiple implementations.
