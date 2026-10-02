const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { analyze, profile } = require('../src/domain/pokemon-aptitude');
const fixture = JSON.parse(require('zlib').gunzipSync(fs.readFileSync(path.join(__dirname, 'fixtures/jogo-2026-09-17.json.gz'))));
const golem = fixture.creatures.find(c => c.name === 'Golem');
const helper = fs.readFileSync(path.join(__dirname, '../presets/justpokedex.js'), 'utf8');
const source = helper.slice(helper.indexOf('    function obterMovesDoPokemon('), helper.indexOf('    let mostrarAbaMoves'));
const normalize = n => String(n || '').toLowerCase().trim();
const getMoves = new Function('creaturesMapByName', 'normalizarNomePokemon', source + ';return obterMovesDoPokemon;')(
  new Map([['golem', golem]]), normalize);
const catalog = getMoves({ nome: 'Golem' });
assert.equal(catalog.length, 10);
assert.equal(catalog.find(g => g.name === 'Crumbling Rain').tm, 'ROCK');
assert(catalog.every(g => g.category === 'PHYSICAL'));

const bridge = helper.slice(helper.indexOf('    window.__pgIv = {'), helper.indexOf('    // Deposito da familia'));
const win = {}, config = { expoentes: { hp: .95, atk: .8, def: .8, spa: .8, spd: .8, vel: .95 }, maxIVTotal: 192, maxIVIndividual: 32 };
new Function('window', 'CONFIG', 'obterMovesDoPokemon', 'normalizarNomePokemon', 'danoPorGolpe', 'ultimoGolpeUsado',
  'estimarIVIndividual', 'arredondar', 'apiCache', 'classificarPotencial', 'calcularPoderEstimado', bridge)(
  win, config, getMoves, normalize, new Map(), '', () => 29, (v, n) => Math.round(v * 10 ** n) / 10 ** n, {}, () => null, () => 0);
async function run() {
  const pk = { nome: 'Golem', nivel: 349, multiplicadorQualidade: 1.595, ivAtual: 170, atk: 933, spa: 543 };
  const bases = { hp: 80, atk: 120, def: 130, spa: 55, spd: 65, vel: 45 };
  const d = await win.__pgIv.calc({ pokemon: pk, bases });
  assert.equal(d.golpes.length, 10, 'ponte entrega o moveset completo');
  const tm = d.golpes.find(g => g.tm);
  assert.equal(tm.tmAprendida, null, 'catálogo não confirma aprendizado de TM');
  let result = analyze(d);
  assert.equal(result.natural.role, 'physical');
  assert.equal(result.current.role, 'physical');
  assert.equal(result.current.advantage, 72);
  assert.equal(result.usable, 9);
  assert.equal(result.aligned, 9);
  win.__poke = { ws: { pokes: { list: [{ name: 'Golem', level: 349, quality: 1.595, ivTotal: 170, tms: ['ROCK'] }] } } };
  result = analyze(await win.__pgIv.calc({ pokemon: pk, bases }));
  assert.equal(result.usable, 10, 'TM confirmada entra na sinergia');
  win.__poke.ws.pokes.list.push({ ...win.__poke.ws.pokes.list[0], tms: [] });
  result = analyze(await win.__pgIv.calc({ pokemon: pk, bases }));
  assert.equal(result.usable, 9, 'exemplares ambíguos não confirmam TM');
  result = analyze({ ...d, pokemon: { nivel: 14 }, nivel: 349 });
  assert(result.lowLevel, 'projeção de nível não esconde aviso do nível observado');
  assert.equal(result.usable, 2, 'nível real bloqueia golpes ainda não disponíveis');
  assert.equal(analyze({ ...d, pokemon: { nivel: 15 } }).lowLevel, false);
  assert.equal(analyze({}).lowLevel, false);
  assert.equal(profile(null, null).role, 'unknown');
  assert.equal(profile(105, 100).role, 'balanced');
  assert.equal(profile(50, 100).role, 'special');
  result = analyze({ bases: { atk: 50, spa: 100 }, atuais: { atk: 100, spa: 200 }, nivel: 40,
    golpes: [{ categoria: 'SPECIAL', nivel: 1, poder: 90 }, { categoria: 'PHYSICAL', nivel: 1, poder: 120 },
      { categoria: 'SPECIAL', nivel: 50, poder: 150 }, { categoria: 'SPECIAL', nivel: 1, poder: 600, tm: 'FIRE', tmAprendida: false },
      { categoria: 'STATUS', nivel: 1, poder: 0 }] });
  assert.equal(result.usable, 2);
  assert.equal(result.aligned, 1, 'golpe mais forte físico não ganha sinergia especial');
  console.log('Aptidão: catálogo, ponte, perfil, sinergia, TMs e aviso de nível aprovados.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
