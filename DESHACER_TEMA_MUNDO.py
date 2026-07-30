#!/usr/bin/env python3
from pathlib import Path
import shutil

page = Path("mundo-cursillo.html")
backup = Path("mundo-cursillo.antes-v2.html")

if not backup.exists():
    raise SystemExit("No existe mundo-cursillo.antes-v2.html.")

shutil.copy2(backup, page)
print("Restaurado el archivo original:", page.resolve())
