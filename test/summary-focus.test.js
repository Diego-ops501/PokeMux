'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const section = (start, end) => html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start)));
const panel = () => {
  const classes = new Set();
  return { classList: { contains: k => classes.has(k), add: k => classes.add(k), remove: k => classes.delete(k) } };
};
const pending = [];
const context = vm.createContext({
  grid: { children: Array.from({ length: 4 }, panel) },
  statsOpen: true, statsIdx: -1, count: 4, dragging: false,
  stTabs: { childElementCount: 5, innerHTML: '', appendChild() {} },
  stBody: { innerHTML: '' }, tabNames: [], off: [], READ_STATE: '',
  webviews: Array.from({ length: 4 }, (_, i) => ({ executeJavaScript: () => new Promise((resolve, reject) => pending.push({ i, resolve, reject })) })),
  document: { createElement: () => ({ style: { setProperty() {} } }) },
  ACOR: [], stName: i => 'Treinador ' + (i + 1), t: k => k,
  ajustaProporcao() {}, renderStats: d => { context.stBody.innerHTML = d.name; }
});
vm.runInContext(section('  function buildStatsTabs()', '  const BAGCOR ='), context);
vm.runInContext(section('  let statsRefreshId =', '  async function trocaLider('), context);
vm.runInContext(section('  function toggleExpand(', '  function togglePower('), context);
const tick = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  context.toggleExpand(2);
  assert.equal(context.statsIdx, 2);
  assert.equal(pending[0].i, 2);
  context.toggleExpand(0);
  pending[1].resolve({ ok: true, name: 'Conta A' });
  await tick();
  pending[0].resolve({ ok: true, name: 'Conta C antiga' });
  await tick();
  assert.equal(context.stBody.innerHTML, 'Conta A', 'leitura atrasada não sobrescreve a conta ampliada');
  assert.equal(context.tabNames[0], 'Conta A');
  assert.equal(context.tabNames[2], undefined);

  // Usa o handler real das abas para selecionar outra conta manualmente.
  const tabs = [];
  context.stTabs.appendChild = tab => tabs.push(tab);
  context.buildStatsTabs();
  tabs[2].onclick();
  assert.equal(context.statsIdx, 1);
  pending[2].resolve({ ok: true, name: 'Conta B manual' });
  await tick();
  assert.equal(context.stBody.innerHTML, 'Conta B manual');
  context.toggleExpand(0); // recolher não muda a seleção manual
  assert.equal(context.statsIdx, 1);
  context.toggleExpand(3);
  assert.equal(context.statsIdx, 3, 'nova ampliação acompanha o novo treinador');
  context.statsOpen = false;
  pending[3].resolve({ ok: true, name: 'Conta D' });
  await tick();
  assert.equal(context.stBody.innerHTML, 'Conta B manual', 'painel fechado ignora a resposta pendente');
  context.toggleExpand(2);
  assert.equal(context.statsIdx, 3, 'painel fechado preserva a seleção');
  context.toggleExpand(9); // painel inexistente
  assert.equal(context.statsIdx, 3);
  vm.runInContext(section('  async function renderAggregate(', '  let statsRefreshId ='), context);
  context.statsOpen = true;
  context.statsIdx = -1;
  const aggregate = context.refreshStats();
  context.toggleExpand(1);
  pending[5].resolve({ ok: true, name: 'Conta B ampliada' });
  await tick();
  pending[4].resolve({ ok: true, name: 'Total antigo' });
  await aggregate;
  assert.equal(context.stBody.innerHTML, 'Conta B ampliada', 'resumo geral pendente não sobrescreve a conta ampliada');
  console.log('Resumo: ampliação, seleção manual e respostas atrasadas aprovadas.');
})().catch(error => { console.error(error); process.exitCode = 1; });
