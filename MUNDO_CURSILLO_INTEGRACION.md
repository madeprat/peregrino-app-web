# Integración de El mundo está de Cursillo

La herramienta publicada contiene miles de líneas de HTML, CSS y JavaScript, con el globo, filtros, palancas, mural, formularios y fuentes de datos en un único archivo.

Por seguridad, la Fase 5 no reescribe esa lógica.

## Archivos incluidos

- `assets/mundo-cursillo-v2.css`
- `assets/mundo-cursillo-v2.js`
- `APLICAR_TEMA_MUNDO.py`
- `DESHACER_TEMA_MUNDO.py`

## Aplicación

1. Conserva el `mundo-cursillo.html` funcional que tienes ahora publicado.
2. Ponlo dentro de la carpeta de la Fase 5, sustituyendo la vista previa.
3. Ejecuta:

```bash
python3 APLICAR_TEMA_MUNDO.py
```

El script crea automáticamente:

`mundo-cursillo.antes-v2.html`

Después deja el mismo archivo funcional con dos referencias nuevas:

```html
<link rel="stylesheet" href="assets/mundo-cursillo-v2.css">
<script src="assets/mundo-cursillo-v2.js"></script>
```

## Qué cambia

- Fondo general luminoso.
- Cabecera blanca.
- Logo oficial cuando esté disponible.
- Tarjetas, filtros, KPIs y mural claros.
- El globo conserva un fondo profundo para mantener el contraste.
- Enlace de vuelta a Peregrino.
- Selector ficticio Visitante / Miembro.
- Etiqueta de miembro en «Guardar recuerdo».

## Qué no cambia

- IDs.
- Endpoints.
- Lectura de datos.
- Formularios.
- Filtros.
- Globo 3D.
- Palancas.
- Contadores.
- Mural.
- Parámetros.
- JavaScript original.

## Reversión

```bash
python3 DESHACER_TEMA_MUNDO.py
```
