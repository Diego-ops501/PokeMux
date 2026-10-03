'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const helper = fs.readFileSync(path.join(__dirname, '../presets/justpokedex.js'), 'utf8');
const start = helper.indexOf('    let ivMercadoSelecionado =');
const end = helper.indexOf('    function observarLogDeCapturas()', start);
const source = helper.slice(start, end);
const handlers = {}, timers = [], captures = [];
let visible = true, hovered = false;
let iv = 175, quality = 1.43;
const stats = [18, 15, 18, 33, 24, 31];
const details = {
  get innerText() { return `Abra Lv.15\nNível 15\nIV ${iv}/192\nRaridade Rara ×${quality}\nPoder ⚡194`; },
  getClientRects: () => visible ? [{}] : [],
  matches: () => hovered,
  contains: () => false,
  querySelector: () => ({ innerText: 'Abra Lv.15' }),
  querySelectorAll: selector => selector.includes('statcell')
    ? stats.map(value => ({ innerText: `Atributo ${value}` }))
    : [{ innerText: 'Psíquico' }, { innerText: 'Poder' }, { innerText: '194' }]
};
const row = {
  innerText: 'Abra Lv.15 Nv15 IV175 Rara×1.43', isConnected: true,
  matches: () => true, contains: () => false
};
const state = {
  ultimoPokemon: null, ultimoTexto: '', ultimoGolpeUsado: null,
  ivHover: { ativo: false, texto: '', id: 0 },
  window: { __pgIvHoverEnabled: true, __pgIv: { reportar: () => captures.push(state.ultimoPokemon) } },
  document: {
    querySelector: () => details, getElementById: () => null,
    addEventListener: (name, fn) => { handlers[name] = fn; }
  },
  numeroDecimal: text => Number(String(text).replace(',', '.')),
  obterChaveTipo: text => text === 'Psíquico' ? 'psychic' : null,
  normalizarNomePokemon: text => String(text).toLowerCase(), danoPorGolpe: new Map(),
  ivTooltipRestaura() {}, ivHoverEnvia() {},
  ivHoverSai: () => { state.ivHover.ativo = false; state.ivHover.texto = ''; state.ivHover.id++; },
  CONFIG: { panelId: 'pokemon-reader-panel' }, console: { log() {} },
  atualizarPainelLeitor() {}, carregarAnalise() {}, atualizarPainelMoves() {},
  atualizarPosicaoPainelMoves() {}, atualizarPainelComparacao() {},
  setTimeout: fn => timers.push(fn)
};
const api = new Function('state', 'with(state) {' + source
  + 'iniciarEscutasEventos();return { read: processarDadosMercado }; }')(state);
const click = () => handlers.click({ target: { closest: () => row }, clientX: 420, clientY: 320 });
click(); timers.shift()();
assert.equal(captures.length, 1, 'selecionar anúncio ativa o cálculo sem depender de .inv-tip');
assert.equal(state.ivHover.alvo, row);
assert.equal(state.ivHover.x, 420);
assert.equal(captures[0].nome, 'Abra');
assert.equal(captures[0].nivel, 15);
assert.equal(captures[0].ivAtual, 175);
assert.equal(captures[0].multiplicadorQualidade, 1.43);
assert.deepEqual(captures[0].tipos, ['Psíquico']);
assert.deepEqual(['hp', 'atk', 'def', 'spa', 'spd', 'vel'].map(k => captures[0][k]), stats);
api.read();
assert.equal(captures.length, 1, 'observer não recalcula repetidamente o mesmo anúncio');

row.innerText = 'Abra Lv.15 Nv15 IV177 Rara×1.36';
click(); timers.shift()();
assert.equal(captures.length, 1, 'lateral antiga não é usada para outro anúncio');
iv = 177; quality = 1.36;
api.read();
assert.equal(captures.length, 2, 'atualização da lateral inicia leitura do novo exemplar');
assert.equal(captures[1].ivAtual, 177);
assert.equal(captures[1].multiplicadorQualidade, 1.36);
state.ivHoverSai(); hovered = true;
handlers.mouseover({ target: { closest: () => details }, relatedTarget: null, clientX: 810, clientY: 270 });
assert.equal(captures.length, 3, 'passar o mouse na lateral também calcula');
assert.equal(state.ivHover.alvo, details);
state.window.__pgIvHoverEnabled = false; state.ivHoverSai(); api.read();
assert.equal(captures.length, 3, 'IV desligado não lê anúncios');
state.window.__pgIvHoverEnabled = true; visible = false; api.read();
assert.equal(captures.length, 3, 'mercado fechado não reapresenta anúncio antigo');
visible = true; stats[0] = null; api.read();
assert.equal(captures.length, 3, 'atributos incompletos aguardam a lateral terminar de carregar');
console.log('IV mercado: anúncios, lateral, atributos, troca de exemplar e toggle aprovados.');
