#!/usr/bin/env python3
"""
Aplica la identidad visual Peregrino Web V2 al mundo-cursillo.html ORIGINAL.

Uso:
  1. Coloca este script junto a tu mundo-cursillo.html funcional.
  2. Comprueba que también existen:
       assets/mundo-cursillo-v2.css
       assets/mundo-cursillo-v2.js
  3. Ejecuta:
       python3 APLICAR_TEMA_MUNDO.py

El script:
  - se niega a modificar una vista previa con iframe;
  - valida que el archivo contiene el mapa y el panel de palancas;
  - crea mundo-cursillo.antes-v2.html;
  - inserta únicamente una hoja CSS y un JS;
  - no cambia endpoints, IDs, formularios ni lógica original.
"""

from pathlib import Path
import shutil
import sys

page = Path("mundo-cursillo.html")
backup = Path("mundo-cursillo.antes-v2.html")
css_file = Path("assets/mundo-cursillo-v2.css")
js_file = Path("assets/mundo-cursillo-v2.js")

for required in (page, css_file, js_file):
    if not required.exists():
        raise SystemExit(f"Falta el archivo necesario: {required}")

text = page.read_text(encoding="utf-8")

if "<iframe" in text and "madeprat.github.io/peregrino-app-web/mundo-cursillo.html" in text:
    raise SystemExit(
        "Este mundo-cursillo.html es la vista previa de la maqueta, no el archivo "
        "funcional original. Copia aquí el archivo publicado actual y vuelve a ejecutar."
    )

required_markers = ("id=\"map\"", "class=\"mural", "class=\"app")
missing = [marker for marker in required_markers if marker not in text]
if missing:
    raise SystemExit(
        "El archivo no parece ser la herramienta original. Faltan: " + ", ".join(missing)
    )

if not backup.exists():
    shutil.copy2(page, backup)

css_link = '<link rel="stylesheet" href="assets/mundo-cursillo-v2.css" />'
js_link = '<script src="assets/mundo-cursillo-v2.js"></script>'

changed = False

if "mundo-cursillo-v2.css" not in text:
    text = text.replace("</head>", f"  {css_link}\n</head>", 1)
    changed = True

if "mundo-cursillo-v2.js" not in text:
    text = text.replace("</body>", f"  {js_link}\n</body>", 1)
    changed = True

text = text.replace(
    '<meta name="theme-color" content="#0b1220" />',
    '<meta name="theme-color" content="#fffaf0" />',
    1,
)

page.write_text(text, encoding="utf-8")

print("Tema V2 aplicado." if changed else "El tema V2 ya estaba aplicado.")
print("Archivo funcional:", page.resolve())
print("Copia de seguridad:", backup.resolve())
print("Para volver atrás: python3 DESHACER_TEMA_MUNDO.py")
