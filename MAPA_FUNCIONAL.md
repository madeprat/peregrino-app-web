# Mapa funcional propuesto

## 1. Peregrino APP

- Inicio.
- Presentación de funciones.
- Capturas.
- Descarga.
- Planes.
- Manual.

## 2. Oración y comunidad

### Abierto

- El mundo está de Cursillo.
- Consultar el mapa y los Cursillos.
- Ver palancas.
- Ofrecer una palanca.
- Inicio (`inicio.html`): la pantalla diaria que se abre desde el icono del móvil, con la oración del día, una luz para hoy y las puertas a Biblioteca, velita, regalo y rezar en grupo.
- Encender una velita (Rincón de la Luz). La intención se queda en el dispositivo.
- Regalar una oración (`regalo-de-oracion.html`): sin parámetros se crea la tarjeta; con `?nombre=…&tono=…` se recibe.
- Rezar en la Biblioteca, en español, latín, portugués o inglés (solo lectura: sin copiar, guardar ni imprimir).
- Oración del día en la portada, en el idioma de cada persona.
- Recibir una tarjeta o invitación.
- Reunión de Grupo (`reunion-de-grupo.html`): el guion gratuito de la app (la guía y los cuatro momentos de `sala/reunion/reunion_fundamental_v1.json`), para seguirlo en persona desde un solo móvil, y la entrada con código a la sala en línea. La sala en línea se crea desde la app.

### Posible ventaja de miembro

- Crear una tarjeta de oración personalizada.
- Crear una invitación «Alguien está rezando por ti».
- Guardar un recuerdo de un Cursillo.
- Acceder a colecciones editoriales especiales.

La diferencia de miembro se plantea sobre la personalización, la memoria y la presentación. No sobre la eficacia de una oración, la visibilidad de una intención ni el acceso a la fe.

## 3. Descubre el Cursillo

- Qué es el MCC.
- Quiero vivir un Cursillo.
- Alguien está rezando por ti.
- Reunión de Grupo.
- Apostolado digital.

Estas puertas deben permanecer abiertas para quien llega por primera vez.

## 4. El proyecto

- Manifiesto.
- Historieta.
- Principios.
- Apoyo voluntario.
- Información legal.

## 5. Páginas técnicas que deben conservar sus rutas

- `bordon/index.html`
- Enlaces profundos de la app.
- Salas (`sala/?c=CÓDIGO`): 4 caracteres para una oración en grupo y 6 para una Reunión de Grupo en línea (`sala/reunion/`). El archivo `sala/reunion/reunion_fundamental_v1.json` es copia exacta del de la app.
- Parámetros de invitaciones.
- Enlaces a una oración de la biblioteca (`biblioteca-oraciones.html#rezar/<id>/<idioma>`).
- Formularios y fuentes de datos.
- Páginas de confirmación y agradecimiento.

## Web instalable

- `manifest.webmanifest` e iconos en `assets/icon/`: se instala como app (pantalla completa) y abre en `inicio.html`.
- En iPhone se añade desde Safari → Compartir → «Añadir a pantalla de inicio»; la portada y el Inicio lo explican (`assets/instalar-v1.js`).
- Si se abre como app en la portada, se pasa directamente al Inicio.
- Abierta como app (`assets/app-v1.js` y `app-v1.css`), Inicio, Biblioteca, Rincón de la Luz, Regalo y la sala muestran navegación de app: barra inferior en el móvil y barra lateral en pantallas anchas, sin el menú de la web. No guarda nada. Para verlo sin instalar, añadir `?app=1` a la dirección.
- Inicio tiene la tarjeta «Palabra de Dios» con los mismos enlaces que Peregrinar en la app (Evangelio del día en Vatican News y los Evangelios en vatican.va), avisando de que se abren fuera de Peregrino.
- La oración del mes por quienes sostienen Peregrino está en la página de apoyo (`plan-apostol.html#oracion-del-mes`).

## Idioma

- La web está en español y se traduce con el traductor de Google (`assets/idioma-v1.js`).
- En la primera visita se aplica el idioma del sistema de la persona; después manda lo que elija, y siempre hay un botón «ES Español» para volver al original.
- Las oraciones nunca se traducen a máquina: se rezan en sus cuatro idiomas revisados (`assets/oracion-v1.js`), y quien no habla ninguno de ellos empieza en inglés o, si su lengua es cercana al español, en español.

## Navegación principal

La portada tiene una sola idea y una sola acción. El menú, cuatro entradas y la descarga:

1. Rezar (`inicio.html`).
2. La app (`la-app.html`): qué hace la app, cómo instalarla y los planes.
3. Descubre (`descubre.html`): todo Peregrino ordenado por el Trípode.
4. El proyecto (`manifiesto.html`).

En la portada, la acción principal depende del dispositivo: en Android, el distintivo oficial de Google Play; en iPhone y ordenador, «Empezar a rezar» (la web). El distintivo de App Store solo se usará cuando la app esté publicada.

## Principio visual

- Fondo principal marfil.
- Tarjetas blancas.
- Azul profundo para estructura y contraste.
- Los colores del logo como acentos.
- Dorado cálido en pequeñas dosis.
- Secciones oscuras únicamente cuando aportan jerarquía.
- Logo oficial visible en encabezado y pie.
