"""Smoke test: render a minimal HTML document to PDF using WeasyPrint."""

import sys
from pathlib import Path

try:
    import weasyprint
except ImportError:
    print("ERROR: weasyprint is not installed.")
    sys.exit(1)

html = "<html><body><h1>Hello WeasyPrint</h1></body></html>"
out = Path(__file__).parent / "test.pdf"

pdf_bytes = weasyprint.HTML(string=html).write_pdf()
out.write_bytes(pdf_bytes)

if not out.exists() or out.stat().st_size == 0:
    print("ERROR: PDF was not written or is empty.")
    sys.exit(1)

print(f"OK: PDF written to {out} ({out.stat().st_size} bytes)")
