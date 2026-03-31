from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from jinja2 import Environment, FileSystemLoader


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "sample.invoice.json"
TEMPLATE_ROOT = ROOT / "templates"
STYLE_PATH = ROOT / "styles" / "invoice.css"
DEFAULT_OUTPUT = ROOT / "output" / "weasyprint" / "invoice.weasyprint.pdf"


def bootstrap_runtime() -> None:
    updates: dict[str, str] = {}

    if sys.platform == "darwin":
        homebrew_lib = Path("/opt/homebrew/lib")
        if homebrew_lib.exists():
            current = os.environ.get("DYLD_FALLBACK_LIBRARY_PATH", "")
            paths = [path for path in current.split(":") if path]
            if str(homebrew_lib) not in paths:
                updates["DYLD_FALLBACK_LIBRARY_PATH"] = ":".join([str(homebrew_lib), *paths])

    cache_home = ROOT / ".cache"
    cache_home.mkdir(parents=True, exist_ok=True)
    if os.environ.get("XDG_CACHE_HOME") != str(cache_home):
        updates["XDG_CACHE_HOME"] = str(cache_home)

    if updates and os.environ.get("INVOICE_WEASYPRINT_ENV_READY") != "1":
        env = os.environ.copy()
        env.update(updates)
        env["INVOICE_WEASYPRINT_ENV_READY"] = "1"
        os.execvpe(sys.executable, [sys.executable, *sys.argv], env)


bootstrap_runtime()

from weasyprint import HTML


def format_date(value: str) -> str:
    return datetime.strptime(value, "%Y-%m-%d").strftime("%d %b %Y")


def format_money(value: str, currency: str) -> str:
    return f"{currency} {Decimal(str(value)):.2f}"


def build_environment() -> Environment:
    env = Environment(loader=FileSystemLoader(TEMPLATE_ROOT), autoescape=True)
    env.filters["format_date"] = format_date
    env.filters["format_money"] = format_money
    return env


def render_html(data: dict) -> str:
    env = build_environment()
    template = env.get_template("invoice.html.njk")
    css = STYLE_PATH.read_text(encoding="utf-8")
    return template.render(css=css, **data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate invoice PDF with WeasyPrint.")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Destination PDF path."
    )
    args = parser.parse_args()

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    html = render_html(data)

    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    HTML(string=html, base_url=str(ROOT)).write_pdf(output_path)
    print(f"WeasyPrint PDF written to {output_path}")


if __name__ == "__main__":
    main()
