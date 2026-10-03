'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const helper = fs.readFileSync(path.join(__dirname, '../presets/justpokedex.js'), 'utf8');
const section = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const classes = new Set();
const card = {
  style: {},
  classList: { remove: name => classes.delete(name), contains: name => classes.has(name) },
  getBoundingClientRect: () => ({ width: 380, height: 510 })
};
const storage = {};
let rendered = 0;
const env = {
  ivAtivo: true, ivDados: null, ivFonte: -1, ivHoverAtual: null,
  ivEl: card, off: [], innerWidth: 1000, innerHeight: 800,
  webviews: [
    { getBoundingClientRect: () => ({ left: 100, top: 50, width: 400, height: 300 }) },
    { getBoundingClientRect: () => ({ left: 500, top: 350, width: 400, height: 300 }) }
  ],
  ivSane: p => p, ivRender: () => { rendered++; classes.add('show'); },
  lsSet: (k, v) => { storage[k] = v; }, ivToggleRender() {}, ivsBtn: {}
};
new Function('env', 'with(env) {'
  + section(html, '  function ivOculta()', '  const TIPO_COR')
  + section(html, '  function ivPosiciona()', '  // Poder pela fórmula')
  + section(html, '  function ivRecebe(', "  window.addEventListener('resize'")
  + '; env.ivHoverRecebe=ivHoverRecebe; env.ivRecebe=ivRecebe; env.ivOculta=ivOculta; }')(env);

const hover = (id, extra = {}) => ({ ativo: true, id, x: 200, y: 150, width: 400, height: 300, ...extra });
env.ivHoverRecebe(0, hover(1));
assert.equal(env.ivFonte, 0);
assert.equal(card.style.left, '316px', 'coordenadas locais são convertidas para a janela');
env.ivRecebe(0, { hoverId: 1, nome: 'Pikachu' });
assert.equal(rendered, 1);
env.ivHoverRecebe(0, hover(1, { x: 250 }));
assert.equal(card.style.left, '366px', 'caixa acompanha o movimento sem recalcular');
env.ivHoverRecebe(1, hover(2, { x: 390, y: 290 }));
assert(!classes.has('show'), 'troca de conta esconde o resultado anterior');
assert.equal(card.style.left, '494px', 'caixa vira para a esquerda perto da borda');
assert.equal(card.style.top, '114px', 'caixa vira para cima perto da borda');
env.ivRecebe(0, { hoverId: 1 });
env.ivRecebe(1, { hoverId: 1 });
assert.equal(rendered, 1, 'resultados antigos e de outra conta são descartados');
env.ivRecebe(1, { hoverId: 2 });
assert.equal(rendered, 2);
env.ivHoverRecebe(0, { ativo: false });
assert(classes.has('show'), 'saída de outra conta não oculta a atual');
env.ivHoverRecebe(1, { ativo: false });
assert(!classes.has('show'));
env.ivRecebe(1, { hoverId: 2 });
assert.equal(rendered, 2, 'cálculo terminado após sair não reabre a caixa');
env.ivHoverRecebe(0, hover(3, { x: NaN }));
assert.equal(env.ivFonte, -1, 'coordenadas inválidas são rejeitadas');
env.ivsBtn.onclick();
assert.equal(storage.ivHoverEnabled, '0');
env.ivHoverRecebe(0, hover(3));
env.ivRecebe(0, { hoverId: 3 });
assert.equal(rendered, 2, 'desativar impede exibição');
env.ivsBtn.onclick();
assert.equal(storage.ivHoverEnabled, '1');
assert(!classes.has('show'), 'ativar não abre resultado antigo');

async function testHelper() {
  const messages = [], pending = [];
  const events = {};
  let tooltip = { innerText: 'Pikachu\nLv 20\nPower 100', getClientRects: () => [{}] };
  const win = { __pgIvHoverEnabled: true, addEventListener() {} };
  const document = {
    querySelector: () => tooltip,
    addEventListener: (name, fn) => { events[name] = fn; },
    documentElement: { addEventListener: (name, fn) => { events[name] = fn; } }
  };
  const state = { ultimoPokemon: { nome: 'Pikachu' } };
  const source = section(helper, '    const ivHover =', '    // ===== Ponte pro card unico');
  const report = section(helper, '        async reportar() {', '\n    };');
  const toggle = section(helper, '        setEnabled(on) {', '        async calc(entrada)');
  const run = new Function('state', 'window', 'document', 'console', 'CONFIG', 'getComputedStyle', 'setTimeout',
    'with(state) { const innerWidth=400, innerHeight=300; ' + source
    + 'window.__pgIv={ calc: () => new Promise(resolve => state.pending.push(resolve)), ' + toggle + report
    + '}; return { hover:ivHover, send:ivHoverEnvia, leave:ivHoverSai }; }');
  state.pending = pending;
  const api = run(state, win, document, { log: text => messages.push(text) }, { tooltipSelector: '.inv-tip' },
    () => ({ visibility: 'visible' }), fn => { fn(); return 1; });
  api.hover.ativo = true; api.hover.posicao = true; api.hover.id = 1;
  const first = win.__pgIv.reportar();
  api.hover.id = 2; state.ultimoPokemon = { nome: 'Golem' };
  const second = win.__pgIv.reportar();
  pending.shift()({ nome: 'Pikachu' }); await first;
  assert(!messages.some(m => m.startsWith('__PGIV__')), 'cálculo atrasado não envia Pokémon anterior');
  pending.shift()({ nome: 'Golem' }); await second;
  assert(messages.some(m => m.startsWith('__PGIV__') && JSON.parse(m.slice(8)).hoverId === 2));
  const third = win.__pgIv.reportar(); tooltip = null;
  pending.shift()({ nome: 'Golem' }); await third;
  assert.equal(messages.filter(m => m.startsWith('__PGIV__')).length, 1, 'tooltip removido cancela resultado');
  assert(messages.some(m => m.startsWith('__PGIVH__') && JSON.parse(m.slice(9)).ativo === false));
  win.__pgIvHoverEnabled = false; api.hover.ativo = true;
  await win.__pgIv.reportar();
  assert.equal(pending.length, 0, 'desativado não inicia cálculo automático');

  const attributes = new Set();
  tooltip = {
    innerText: 'Charizard\nLv 109\nPower 2644', getClientRects: () => [{}],
    setAttribute: name => attributes.add(name), removeAttribute: name => attributes.delete(name)
  };
  win.__pgIvBundled = true;
  win.__pgIvHoverEnabled = true;
  api.hover.ativo = true; api.hover.id = 4; api.hover.texto = tooltip.innerText;
  const chat = win.__pgIv.reportar();
  assert.equal(attributes.size, 0, 'tooltip original permanece durante o cálculo');
  pending.shift()({ nome: 'Charizard' }); await chat;
  assert(attributes.has('data-pg-iv-replaced'), 'resultado calculado substitui o tooltip, inclusive do chat');
  assert.equal(tooltip.innerText, api.hover.texto, 'substituição preserva dados para leitura');
  win.__pgIv.setEnabled(false);
  assert.equal(attributes.size, 0, 'desativar restaura o tooltip original');
  win.__pgIv.setEnabled(true);
  api.hover.ativo = true; api.hover.id = 5; api.hover.texto = tooltip.innerText;
  const failed = win.__pgIv.reportar();
  pending.shift()({ nome: 'Charizard', erro: 'Sem atributos' }); await failed;
  assert.equal(attributes.size, 0, 'erro no cálculo mantém o tooltip original');
  const success = win.__pgIv.reportar();
  pending.shift()({ nome: 'Charizard' }); await success;
  assert(attributes.has('data-pg-iv-replaced'));
  api.leave();
  assert.equal(attributes.size, 0, 'sair do Pokémon remove a substituição');
  console.log('IV hover: posição, contas, cálculos atrasados e substituição do tooltip original aprovados.');
}
testHelper().catch(error => { console.error(error); process.exitCode = 1; });
