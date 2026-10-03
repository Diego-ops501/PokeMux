'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const helper = fs.readFileSync(path.join(__dirname, '../presets/justpokedex.js'), 'utf8');
const fixture = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'fixtures/jogo-2026-09-17.json.gz'))));
const slice = (start, end) => helper.slice(helper.indexOf(start), helper.indexOf(end, helper.indexOf(start)));
function setup(fetch) {
  const state = {
    creaturesData: [], creaturesMapByName: new Map(), creaturesReady: null,
    baseRequests: new Map(), apiCache: {}, fetch,
    TYPE_SYSTEM: { TRADUCOES: { psychic: 'Psíquico', fire: 'Fogo' } },
    salvarCache() {}, console: { log() {}, warn() {} }
  };
  const api = new Function('state', 'with(state) {'
    + slice('    function normalizarNomePokemon(', '    function formatarNumero(')
    + slice('    async function carregarCreatures()', '    function obterMovesDoPokemon(')
    + slice('    function criaturaDoJogo(', '    async function carregarAnalise(')
    + ';return { load:carregarCreatures, base:buscarAtributosBase }; }')(state);
  return { state, api };
}
async function run() {
  let requests = 0;
  const warm = setup(async url => {
    requests++;
    assert.equal(url, '/game/creatures.json', 'primeira leitura não consulta PokeAPI');
    return { ok: true, json: async () => fixture };
  });
  warm.state.creaturesReady = warm.api.load();
  await warm.state.creaturesReady;
  assert(warm.state.apiCache.abra, 'catálogo prepara os atributos antes do hover');
  const abra = await warm.api.base('Abra');
  assert.deepEqual([abra.hp, abra.atk, abra.def, abra.spa, abra.spd, abra.vel], [25, 20, 15, 105, 55, 90]);
  assert.deepEqual(abra.tipos, ['Psíquico']);
  assert.equal(abra.id, 63);
  assert.equal((await warm.api.base('Shiny Abra')).spa, 105);
  const furious = await warm.api.base('Furious Scyther');
  assert.equal(furious.atk, 110, 'formas próprias usam os dados do jogo');
  assert.equal(requests, 1, 'hover de espécies inéditas usa somente o catálogo já carregado');

  let finishCatalog, coldRequests = 0;
  const cold = setup(url => {
    coldRequests++;
    assert.equal(url, '/game/creatures.json');
    return new Promise(resolve => { finishCatalog = resolve; });
  });
  cold.state.creaturesReady = cold.api.load();
  const first = cold.api.base('Abra'), second = cold.api.base('Abra');
  assert.equal(coldRequests, 1, 'hover durante o boot reaproveita a requisição em andamento');
  finishCatalog({ ok: true, json: async () => fixture });
  assert.equal((await first).spa, 105);
  assert.equal((await second).spa, 105);
  assert.equal(cold.state.baseRequests.size, 0);

  let finishRemote, remoteRequests = 0;
  const remote = setup(() => {
    remoteRequests++;
    return new Promise(resolve => { finishRemote = resolve; });
  });
  const a = remote.api.base('Missingmon'), b = remote.api.base('Missingmon');
  assert.equal(remoteRequests, 1, 'leituras simultâneas compartilham o fallback externo');
  finishRemote({ ok: true, json: async () => ({ id: 1, stats: [{ stat: { name: 'hp' }, base_stat: 45 }], types: [] }) });
  assert.equal((await a).hp, 45); assert.equal((await b).hp, 45);
  assert.equal((await remote.api.base('Missingmon')).hp, 45);
  assert.equal(remoteRequests, 1, 'fallback também fica em cache');

  const invalid = setup(async () => { throw new Error('offline'); });
  await assert.rejects(invalid.api.base(''), /Nome do Pokémon inválido/);
  await assert.rejects(invalid.api.base('Missingmon'), /Pokémon não encontrado/);
  assert.equal(invalid.state.baseRequests.size, 0, 'falha não trava tentativas futuras');
  console.log('IV cache: pré-carregamento, primeiro hover sem PokeAPI, formas e requisições compartilhadas aprovados.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
