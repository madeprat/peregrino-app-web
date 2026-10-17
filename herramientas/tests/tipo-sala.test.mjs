// Ejecutar desde la raíz del repo:  node --test herramientas/tests/*.test.mjs
//
// Una sala que la web no reconoce no debe mostrarse nunca como Rosario.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { tipoSala } from '../../sala/tipo-sala.js';

const raiz = fileURLToPath(new URL('../../', import.meta.url));

test('reconoce oracion y rosario', () => {
  assert.equal(tipoSala({ prayerType: 'oracion' }), 'oracion');
  assert.equal(tipoSala({ prayerType: 'rosario' }), 'rosario');
  assert.equal(tipoSala({ prayerType: ' Oracion ' }), 'oracion');
  assert.equal(tipoSala({ prayerType: 'ROSARIO' }), 'rosario');
});

test('un tipo ausente o desconocido nunca es rosario', () => {
  const casos = [
    null,
    undefined,
    {},
    { prayerType: null },
    { prayerType: '' },
    { prayerType: 'oración' },
    { prayerType: 'laudes' },
    { prayerType: 42 },
    { prayerSubtype: 'joyful' },
  ];
  for (const data of casos) {
    assert.equal(tipoSala(data), 'desconocido', JSON.stringify(data));
  }
});

test('sala.js no envía las salas desconocidas a la vista de Rosario', () => {
  const sala = readFileSync(`${raiz}sala/sala.js`, 'utf8');
  assert.match(sala, /from '\.\/tipo-sala\.js'/);
  const inicio = sala.indexOf('if (!rosario && !esOracion(data)) {');
  assert.ok(inicio > 0, 'falta la rama de tipo desconocido');
  const rama = sala.slice(inicio, sala.indexOf('\n  }\n', inicio));
  assert.doesNotMatch(rama, /viewRosario/);
  assert.match(rama, /mostrarFin\(/);
});
