#!/bin/bash

# Script para mantener Google Translate entre páginas en Peregrino APP
# Uso: ./actualizar-google-translate.sh
# 
# Este script:
# 1. Crea backups de todos los HTMLs
# 2. Inserta el script de persistencia en el <head> de TODOS los archivos .html
# 3. Te permite revertir si algo sale mal

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# El script a insertar
SCRIPT_CONTENT='  <script>
    (function() {
      const savedLang = localStorage.getItem("gTranslateLang");
      
      if (savedLang && savedLang !== "es") {
        window.addEventListener("load", function() {
          setTimeout(function() {
            const selectElement = document.querySelector(".goog-te-combo");
            if (selectElement) {
              selectElement.value = savedLang;
              selectElement.dispatchEvent(new Event("change"));
            }
          }, 300);
        });
      }
      
      const observer = new MutationObserver(function() {
        const selectElement = document.querySelector(".goog-te-combo");
        if (selectElement) {
          selectElement.removeEventListener("change", handleLanguageChange);
          selectElement.addEventListener("change", handleLanguageChange);
        }
      });
      
      function handleLanguageChange(e) {
        const selectedLang = e.target.value;
        localStorage.setItem("gTranslateLang", selectedLang);
      }
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    })();
  </script>'

echo -e "${YELLOW}🚀 Actualizando Google Translate en todos los HTMLs...${NC}\n"

# Crear carpeta de backups
BACKUP_DIR="backups_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✅ Carpeta de backups creada: $BACKUP_DIR${NC}\n"

# Contar HTMLs
HTML_COUNT=$(find . -maxdepth 1 -name "*.html" -type f | wc -l)
echo -e "${YELLOW}📄 Se encontraron $HTML_COUNT archivos HTML${NC}\n"

# Procesar cada HTML
count=0
for html_file in *.html; do
  if [ -f "$html_file" ]; then
    count=$((count + 1))
    
    echo -n "[$count/$HTML_COUNT] Procesando $html_file... "
    
    # Crear backup
    cp "$html_file" "$BACKUP_DIR/$html_file.backup"
    
    # Crear archivo temporal
    temp_file="${html_file}.tmp"
    
    # Verificar si ya tiene el script (para evitar duplicados)
    if grep -q "gTranslateLang" "$html_file"; then
      echo -e "${YELLOW}(ya tiene el script)${NC}"
      rm "$temp_file" 2>/dev/null || true
      continue
    fi
    
    # Insertar el script ANTES de </head>
    # Esto es un poco complicado en sed, así que usamos un enfoque más seguro
    awk -v script="$SCRIPT_CONTENT" '
    /<\/head>/ && !found {
      print script;
      found=1;
    }
    {print}
    ' "$html_file" > "$temp_file"
    
    # Reemplazar el archivo original
    mv "$temp_file" "$html_file"
    echo -e "${GREEN}✅${NC}"
  fi
done

echo -e "\n${GREEN}✅ ¡Actualización completada!${NC}\n"
echo -e "${YELLOW}📊 Resumen:${NC}"
echo "   • Archivos procesados: $count"
echo "   • Backups guardados en: $BACKUP_DIR"
echo ""
echo -e "${YELLOW}🔄 Para revertir los cambios, ejecuta:${NC}"
echo "   cp $BACKUP_DIR/*.backup ."
echo "   for f in *.backup; do mv \"\$f\" \"\${f%.backup}\"; done"
echo ""
echo -e "${GREEN}🚀 ¡Listo! Ahora Git puede ver los cambios con:${NC}"
echo "   git diff"
echo ""
echo -e "${YELLOW}📝 Sube los cambios con:${NC}"
echo "   git add *.html"
echo "   git commit -m 'feat: mantener Google Translate entre páginas'"
echo "   git push"
