/**
 * Buzón de Peregrino: recibe los mensajes del formulario de contacto de la web
 * (contacto.html) y los guarda en esta hoja de cálculo.
 *
 * Instalación (una sola vez):
 *  1. Crea una hoja de cálculo de Google nueva, por ejemplo «Buzón Peregrino».
 *  2. Extensiones → Apps Script. Borra el código que aparece y pega este archivo.
 *  3. Guarda. En la barra de arriba elige la función «preparar» y pulsa Ejecutar.
 *     Acepta los permisos. Se crean las pestañas «Mensajes» y «Testimonios».
 *  4. Implementar → Nueva implementación → tipo «Aplicación web».
 *     Ejecutar como: «Yo». Quién tiene acceso: «Cualquier usuario».
 *  5. Copia la URL que termina en /exec: es la que se pone en la web.
 *
 * Si cambias este código: Implementar → Gestionar implementaciones → editar
 * (lápiz) → Versión: «Nueva versión». Así la URL no cambia.
 */

// Correo al que llega un aviso por cada mensaje. Déjalo vacío ('') para no recibir avisos.
const CORREO_AVISOS = 'peregrinoapp@outlook.es';

const HOJA_MENSAJES = 'Mensajes';
const HOJA_TESTIMONIOS = 'Testimonios';

const COLUMNAS = [
  'Fecha', 'Tipo', 'Sobre', 'Dónde', 'Mensaje', 'Gravedad', 'Dispositivo',
  'Lo que más valora', 'Testimonio autorizado', 'Nombre para publicar', 'Lugar',
  'Nombre', 'Email', 'Página de origen', 'Navegador',
  'Prioridad', 'Estado', 'Publicar testimonio', 'Notas'
];

const ESTADOS = ['Nuevo', 'En curso', 'Respondido', 'Resuelto', 'Descartado'];
const PRIORIDADES = ['Alta', 'Media', 'Baja'];

const TIPOS = ['Sugerencia', 'Petición', 'Incidencia', 'Felicitación', 'Agradecimiento', 'Otra cosa'];
const LIMITES = { corto: 120, medio: 400, largo: 4000 };

function preparar() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_MENSAJES);
  if (!hoja) hoja = libro.insertSheet(HOJA_MENSAJES, 0);
  hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS])
    .setFontWeight('bold').setBackground('#173f7a').setFontColor('#ffffff');
  hoja.setFrozenRows(1);
  hoja.setColumnWidth(col_('Mensaje'), 420);
  hoja.getRange(2, col_('Mensaje'), hoja.getMaxRows() - 1, 1).setWrap(true);

  const lista = (valores) => SpreadsheetApp.newDataValidation().requireValueInList(valores, true).build();
  const filas = hoja.getMaxRows() - 1;
  hoja.getRange(2, col_('Estado'), filas, 1).setDataValidation(lista(ESTADOS));
  hoja.getRange(2, col_('Prioridad'), filas, 1).setDataValidation(lista(PRIORIDADES));
  hoja.getRange(2, col_('Publicar testimonio'), filas, 1).setDataValidation(lista(['Sí', 'No']));

  // Colores para ver de un vistazo lo urgente y lo pendiente.
  const rangoPrioridad = hoja.getRange(2, col_('Prioridad'), filas, 1);
  const rangoEstado = hoja.getRange(2, col_('Estado'), filas, 1);
  const regla = (rango, texto, fondo) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(texto).setBackground(fondo).setRanges([rango]).build();
  hoja.setConditionalFormatRules([
    regla(rangoPrioridad, 'Alta', '#f8d7da'),
    regla(rangoPrioridad, 'Media', '#fff3cd'),
    regla(rangoEstado, 'Nuevo', '#dbe7f7'),
    regla(rangoEstado, 'Resuelto', '#d4edda')
  ]);

  // Pestaña con solo los testimonios aprobados: nombre, lugar y texto, sin emails.
  let testimonios = libro.getSheetByName(HOJA_TESTIMONIOS);
  if (!testimonios) testimonios = libro.insertSheet(HOJA_TESTIMONIOS);
  testimonios.clear();
  const L = (nombre) => letra_(col_(nombre));
  testimonios.getRange('A1').setFormula(
    `=QUERY(${HOJA_MENSAJES}!A:${L('Notas')}, "select ${L('Nombre para publicar')}, ${L('Lugar')}, ${L('Mensaje')}, ${L('Lo que más valora')}, ${L('Fecha')} ` +
    `where ${L('Publicar testimonio')} = 'Sí' and ${L('Testimonio autorizado')} = 'Sí' order by ${L('Fecha')} desc ` +
    `label ${L('Nombre para publicar')} 'nombre', ${L('Lugar')} 'lugar', ${L('Mensaje')} 'texto', ${L('Lo que más valora')} 'valora', ${L('Fecha')} 'fecha'", 1)`
  );
}

function doPost(e) {
  try {
    const datos = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Trampa para robots: un campo oculto que una persona nunca rellena.
    if (datos.web) return respuesta_({ ok: true });

    const tipo = TIPOS.includes(datos.tipo) ? datos.tipo : '';
    const mensaje = limpiar_(datos.mensaje, LIMITES.largo);
    if (!tipo || mensaje.length < 3) return respuesta_({ ok: false, error: 'incompleto' });

    const fila = {
      'Fecha': new Date(),
      'Tipo': tipo,
      'Sobre': limpiar_(datos.sobre, LIMITES.corto),
      'Dónde': limpiar_(datos.donde, LIMITES.corto),
      'Mensaje': mensaje,
      'Gravedad': limpiar_(datos.gravedad, LIMITES.corto),
      'Dispositivo': limpiar_(datos.dispositivo, LIMITES.corto),
      'Lo que más valora': limpiar_(datos.valora, LIMITES.medio),
      'Testimonio autorizado': datos.testimonio === true ? 'Sí' : 'No',
      'Nombre para publicar': datos.testimonio === true ? limpiar_(datos.nombrePublico, LIMITES.corto) : '',
      'Lugar': datos.testimonio === true ? limpiar_(datos.lugar, LIMITES.corto) : '',
      'Nombre': limpiar_(datos.nombre, LIMITES.corto),
      'Email': limpiar_(datos.email, LIMITES.corto),
      'Página de origen': limpiar_(datos.origen, LIMITES.medio),
      'Navegador': limpiar_(datos.navegador, LIMITES.medio),
      'Prioridad': prioridadSugerida_(tipo, datos.gravedad),
      'Estado': 'Nuevo',
      'Publicar testimonio': '',
      'Notas': ''
    };

    const cerrojo = LockService.getScriptLock();
    cerrojo.waitLock(10000);
    try {
      const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_MENSAJES);
      hoja.appendRow(COLUMNAS.map((c) => fila[c]));
    } finally {
      cerrojo.releaseLock();
    }

    if (CORREO_AVISOS) avisar_(fila);
    return respuesta_({ ok: true });
  } catch (error) {
    console.error(error);
    return respuesta_({ ok: false, error: 'servidor' });
  }
}

function doGet() {
  return respuesta_({ ok: true, servicio: 'Buzón Peregrino' });
}

function prioridadSugerida_(tipo, gravedad) {
  if (tipo === 'Incidencia') {
    if (/no puedo/i.test(gravedad || '')) return 'Alta';
    if (/detalle/i.test(gravedad || '')) return 'Baja';
    return 'Media';
  }
  if (tipo === 'Petición' || tipo === 'Sugerencia') return 'Media';
  return 'Baja';
}

function avisar_(fila) {
  const asunto = `[Peregrino] ${fila['Tipo']}${fila['Dónde'] ? ' · ' + fila['Dónde'] : ''}` +
    (fila['Prioridad'] === 'Alta' ? ' · PRIORIDAD ALTA' : '');
  const lineas = [
    `${fila['Tipo']} sobre ${fila['Sobre'] || '—'}${fila['Dónde'] ? ' (' + fila['Dónde'] + ')' : ''}`,
    fila['Gravedad'] ? `Gravedad: ${fila['Gravedad']}` : null,
    fila['Dispositivo'] ? `Dispositivo: ${fila['Dispositivo']}` : null,
    '',
    fila['Mensaje'],
    '',
    fila['Lo que más valora'] ? `Lo que más valora: ${fila['Lo que más valora']}` : null,
    fila['Testimonio autorizado'] === 'Sí' ? `Autoriza publicarlo como testimonio: ${fila['Nombre para publicar']} (${fila['Lugar']})` : null,
    fila['Nombre'] || fila['Email'] ? `De: ${fila['Nombre'] || ''} ${fila['Email'] ? '<' + fila['Email'] + '>' : ''}` : 'Sin datos de contacto',
    '',
    `Abrir el buzón: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`
  ].filter((linea) => linea !== null);
  const opciones = {};
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fila['Email'])) opciones.replyTo = fila['Email'];
  MailApp.sendEmail(CORREO_AVISOS, asunto, lineas.join('\n'), opciones);
}

// Recorta, quita caracteres de control y evita que un texto se interprete como fórmula.
function limpiar_(valor, maximo) {
  let texto = String(valor == null ? '' : valor)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maximo);
  if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
  return texto;
}

function respuesta_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

function col_(nombre) {
  return COLUMNAS.indexOf(nombre) + 1;
}

function letra_(numero) {
  let letra = '';
  while (numero > 0) {
    const resto = (numero - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    numero = Math.floor((numero - 1) / 26);
  }
  return letra;
}
