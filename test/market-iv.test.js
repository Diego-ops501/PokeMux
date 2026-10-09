const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../src/domain/global-market');
const helper = fs.readFileSync(path.join(__dirname, '../presets/justpokedex.js'), 'utf8');
const section = (start, end) => helper.slice(helper.indexOf(start), helper.indexOf(end, helper.indexOf(start)));
const state = {
  CONFIG: { maxIVIndividual: 32, maxIVTotal: 192, expoentes: { hp: .95, atk: .8, def: .8, spa: .8, spd: .8, vel: .95 } },
  limitar: (n, min, max) => Math.min(max, Math.max(min, n)), arredondar: (n, digits) => +n.toFixed(digits),
  classificarPotencial: () => ({}), apiCache: {}, normalizarNomePokemon: n => n.toLowerCase(),
  obterMovesDoPokemon: () => [], danoPorGolpe: new Map(), window: {}
};
const calc = new Function('state', 'with(state) {'
  + section('    function estimarIVIndividual(', '    function calcularPotencialExemplar(')
  + 'return ({' + section('        async calc(entrada)', '        // avisa o app:') + '}).calc; }')(state);
async function run() {
  const species = { pokeId: 130, name: 'Gyarados', type1: 'WATER', type2: 'FLYING', baseHp: 95, baseAtk: 125, baseDef: 79, baseSpAtk: 60, baseSpDef: 100, baseSpeed: 81 };
  let calls = 0, input;
  const P = { api: { '/api/characters/me': { character: { id: 'c1' } }, '/game/creatures.json': { creatures: [species, { ...species, pokeId: 10130, baseAtk: 180 }] } } };
  const context = { window: { __poke: P, __pgIv: { calc: async args => { calls++; input = args; return calc(args); } } },
    location: { origin: 'https://poke.idleworld.online', pathname: '/play' }, AbortController, setTimeout, clearTimeout,
    fetch: async () => { throw Error('catalog should be cached'); } };
  const listing = { id: 'listing', kind: 'pokemon', name: 'Gyarados', speciesId: 130, level: 138, quality: 1.53, ivTotal: 177, power: 2713,
    stats: { hp: 325, atk: 359, def: 262, spAtk: 221, spDef: 310, speed: 296 }, tms: ['FIRE'], token: 'private-data' };
  const read = (pokemon = listing, cid = 'c1') => vm.runInNewContext(M.ivScript(pokemon, cid), context);
  const result = await read();
  assert.equal(result.ivTotal, 177);
  assert.equal(result.percentual, 177 / 192 * 100);
  assert.equal(result.nivel, 138);
  assert.equal(result.atuais.spa, 221);
  assert.equal(input.pokemon.tms[0], 'FIRE');
  assert(!M.ivScript(listing, 'c1').includes('private-data'));
  const expected = [31, 30, 28, 27, 30, 31];
  ['hp', 'atk', 'def', 'spa', 'spd', 'vel'].forEach((key, i) => assert(Math.abs(result.ivs[key] - expected[i]) < .5, 'uses the bundled IV calculation: ' + key));
  const form = await read({ ...listing, speciesId: 10130, shiny: true });
  assert.equal(input.bases.atk, 180, 'same-name form uses its exact species ID');
  assert.equal(form.shiny, true);
  assert.equal((await read({ ...listing, stats: { ...listing.stats, hp: null } })).erro, 'missingConditions');
  assert.equal(calls, 2, 'incomplete stats are not calculated as zero');
  assert.equal((await read(listing, 'other')).erro, 'changed');
  assert.equal((await read({ ...listing, speciesId: 99999 })).erro, 'noSpecies');
  delete P.api['/game/creatures.json']; let fetches = 0;
  context.fetch = async url => { assert.equal(url, '/game/creatures.json'); fetches++; return { ok: true, json: async () => ({ creatures: [species] }) }; };
  await read(); await read(); assert.equal(fetches, 1, 'catalog cached between listings');
  context.window.__pgIv.calc = async () => { P.api['/api/characters/me'].character.id = 'c2'; return result; };
  assert.equal((await read()).erro, 'changed', 'character change during calculation rejected');
  P.api['/api/characters/me'].character.id = 'c1'; delete context.window.__pgIv;
  assert.equal((await read()).erro, 'ivUnavailable');
  console.log('ok market-iv: bundled calculator, stats, exact forms, shiny, missing data, cache and session');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
