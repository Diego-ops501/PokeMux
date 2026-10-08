const assert = require('node:assert/strict');
const vm = require('node:vm');
const M = require('../src/domain/global-market');

async function run() {
  assert.deepEqual(M.query({ category: '../../action' }), { category: 'All' });
  assert.deepEqual(M.query({ browse: 'species', action: 'buy' }), { browse: 'species' });
  const query = M.query({ browse: 'pokemon', page: -3, sort: 'price-asc', shiny: true, q: 'Abra & shiny', type: 'PSYCHIC', ivMin: 130, lvMax: 50, qMin: '1,5', gradesOff: ['Fraca', 'Fraca', 'invalid'], action: 'buy' });
  assert.deepEqual(query, { browse: 'pokemon', page: '1', sort: 'price-asc', q: 'Abra & shiny', shiny: '1', type: 'PSYCHIC', gradesOff: 'Fraca', ivMin: '130', lvMax: '50', qMin: '1.5' });
  assert.equal(M.query({ browse: 'pokemon', speciesId: 63, q: 'Abra' }).q, undefined);
  const chain = [{ speciesId: 63, evolvesToId: 64 }, { speciesId: 64, evolvesToId: 65 }, { speciesId: 65, evolvesToId: 0 }, { speciesId: 10063, evolvesToId: 10064 }, { speciesId: 10064 }];
  assert.deepEqual(M.evolutionIds(63, chain), [63, 64, 65]);
  assert.deepEqual(M.evolutionIds(64, chain), [63, 64, 65]);
  assert.deepEqual(M.evolutionIds(10063, chain), [10063, 10064]);
  assert.deepEqual(M.evolutionIds(65, chain), [63, 64, 65]);
  const starters = [{ speciesId: 1, evolvesToId: 2 }, { speciesId: 2, evolvesToId: 3 }, { speciesId: 3 }];
  assert.deepEqual(M.evolutionIds(3, starters), [1, 2, 3]);
  assert.deepEqual(M.evolutionIds(2, starters), [1, 2, 3]);
  assert.deepEqual(M.evolutionIds(26, [{ speciesId: 172, evolvesToId: 25 }, { speciesId: 25, evolvesToId: 26 }, { speciesId: 26 }]), [172, 25, 26]);
  assert.deepEqual(M.evolutionIds(63, [{ speciesId: 63, evolvesToId: 64 }, { speciesId: 64, evolvesToId: 63 }]), [63, 64]);
  assert.deepEqual(M.evolutionIds(0, chain), []);
  assert.equal(M.safeIcon('https://evil.example/assets/test.png'), '');
  assert.equal(M.safeIcon('/assets/items/potion.png'), 'https://poke.idleworld.online/assets/items/potion.png');
  const safe = M.sanitizeResponse({ token: 'secret', listings: [{ id: 'a', name: 'Abra', auth: 'secret', stats: { hp: 20, token: 'secret' } }], species: [{ speciesId: 63, shiny: 14 }] });
  assert.equal(JSON.stringify(safe).includes('secret'), false);
  assert.equal(safe.species[0].shiny, 14);
  assert.equal(M.sanitizeResponse(safe).species[0].shiny, 14);
  const list = [{ id: 'a', kind: 'pokemon', name: 'Éevee', quality: 1.5, shiny: true, ivTotal: 170, level: 30, type1: 'NORMAL', price: 200 }, { id: 'b', kind: 'pokemon', name: 'Eevee', quality: 1, shiny: false, ivTotal: 80, level: 2, price: 100 }];
  assert.deepEqual(M.filterListings(list, { pokemonOnly: true, q: 'eevee', shiny: true, ivMin: 150, type: 'NORMAL' }).map(x => x.id), ['a']);
  assert.deepEqual(M.filterListings(list, { pokemonOnly: true, gradesOff: ['Épica'] }).map(x => x.id), ['b']);
  assert.deepEqual(M.filterListings(list, { sort: 'price-asc' }).map(x => x.id), ['b', 'a']);
  assert.equal(list[0].id, 'a');
  const own = { kind: 'pokemon', speciesId: 63, shiny: false, level: 30, ivTotal: 100, quality: 1.5 };
  const offers = [
    { ...own, id: 'near', level: 35, price: 200, currency: 'GOLD' },
    { ...own, id: 'cheap', price: 100, currency: 'GOLD' },
    { ...own, id: 'diamond', price: 3, currency: 'DIAMONDS' },
    { ...own, id: 'offer', price: 0, offerOnly: true, currency: 'GOLD' },
    { ...own, id: 'shiny', shiny: true, price: 1, currency: 'GOLD' },
    { ...own, id: 'form', speciesId: 10063, price: 1, currency: 'GOLD' },
    { ...own, id: 'different', ivTotal: 150, price: 300, currency: 'GOLD' },
    { ...own, id: 'unknown', quality: null, price: 400, currency: 'GOLD' }
  ];
  assert.deepEqual(M.comparable(offers, own).map(x => x.id), ['near', 'cheap', 'diamond', 'offer']);
  assert.equal(M.comparable(offers, own, { iv: 0, lv: 0, q: 0 }).length, 3);
  assert.deepEqual(M.comparable(offers, own, { broad: true }).map(x => x.id), ['near', 'cheap', 'diamond', 'offer', 'different', 'unknown']);
  const summary = M.priceSummary(M.comparable(offers, own));
  assert.deepEqual(summary.GOLD, { count: 2, min: 100, max: 200, median: 150 });
  assert.equal(summary.DIAMONDS.median, 3);
  assert.equal(M.priceSummary([]).GOLD.min, null);
  const highlights = M.marketHighlights([
    { kind: 'diamonds', currency: 'GOLD', price: 15000, quantity: 5 },
    { kind: 'diamonds', currency: 'GOLD', price: 12000, quantity: 1 },
    { kind: 'item', refId: 44417, currency: 'GOLD', price: 8000, quantity: 10 },
    { kind: 'item', refId: 44417, currency: 'DIAMONDS', price: 2, quantity: 1 },
    { kind: 'item', refId: 70000, currency: 'GOLD', price: 6000, quantity: 1 },
    { kind: 'item', refId: 70000, currency: 'GOLD', price: 1, quantity: 0 },
    { kind: 'item', refId: 70000, currency: 'DIAMONDS', price: 1, offerOnly: true },
    { kind: 'pokemon', refId: 44417, currency: 'GOLD', price: 1 }
  ]);
  assert.deepEqual(highlights, { diamond: { gold: 12000, diamonds: null }, pheromone: { gold: 8000, diamonds: 2 }, boss: { gold: 6000, diamonds: null } });
  assert.equal(M.comparable([{ kind: 'ball', refId: 1 }, { kind: 'item', refId: 1 }, { kind: 'item', refId: 2 }], { kind: 'item', refId: 1 }).length, 1);
  assert.equal(M.comparable([{ kind: 'item', refId: null }], { kind: 'item', refId: null }).length, 0);
  const now = Date.parse('2026-10-07T21:00:00Z');
  assert.deepEqual(M.listingTime('2026-10-07T19:30:00Z', now), { timestamp: now - 5400000, minutes: 90 });
  assert.equal(M.listingTime(String((now - 60000) / 1000), now).minutes, 1);
  assert.equal(M.listingTime(String(now - 60000), now).minutes, 1);
  assert.equal(M.listingTime('invalid', now), null);
  assert.equal(M.listingTime('', now), null);
  assert.equal(M.listingTime(now + 3600000, now), null);
  assert.equal(M.sanitizeResponse({ listings: [{ at: '2026-10-07T19:30:00Z' }] }).listings[0].at, '2026-10-07T19:30:00Z');
  let calls = [], payload = { listings: list }, status = 200;
  const P = { auth: 'Bearer private-session', api: { '/api/characters/me': { character: { id: 'trainer1', name: 'Tester', gold: 100 } } }, ws: { inventory: { items: [] } } };
  const context = { window: { __poke: P }, location: { origin: 'https://poke.idleworld.online', pathname: '/play' }, AbortController, URLSearchParams, setTimeout, clearTimeout,
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: status === 200, status, json: async () => payload }; } };
  const read = (options = {}, cid = 'trainer1') => vm.runInNewContext(M.readScript(options, cid), context);
  let result = await read();
  assert.equal(result.ok, true);
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[0].url, '/api/game/market?category=All');
  assert.equal(calls[0].options.headers.Authorization, P.auth);
  assert.equal(JSON.stringify(result).includes(P.auth), false);
  P.api['/game/items.json'] = { items: [{ id: 9, name: 'Potion', token: 'private-inventory' }] };
  P.ws.inventory.items = [{ itemId: 9, quantity: 4 }];
  P.ws.balls = { catalog: [{ id: 1, name: 'Ball' }, { id: 2, name: 'Infinite', infinite: true }], counts: { 1: 3, 2: 100 } };
  P.ws.pokes = { list: [{ id: 'p1', pokeId: 63, name: 'Abra', ivTotal: '100/192', quality: '1,50', level: 30, token: 'private-inventory' }] };
  P.api['/game/creatures.json'] = { creatures: [{ pokeId: 10063, name: 'Regional Abra', evolvesToId: 10064, token: 'private-inventory' }] };
  result = await read({ includeOwned: true, includeAlertCatalog: true });
  assert.equal(result.data.ownedReady, true);
  assert.equal(result.data.owned.length, 3);
  assert.equal(result.data.owned[2].speciesId, 63);
  assert.equal(result.data.owned[2].ivTotal, 100);
  assert.equal(result.data.owned[2].quality, 1.5);
  assert.equal(result.data.alertCatalog[0].speciesId, 10063);
  assert.equal(result.data.alertCatalog[0].evolvesToId, 10064);
  assert.equal(JSON.stringify(result).includes('private-inventory'), false);
  assert.equal(calls[1].url, '/api/game/market?category=All');
  assert.equal((await read({}, 'other-trainer')).reason, 'changed');
  assert.equal(calls.length, 2);
  status = 429; assert.equal((await read()).reason, 'limited');
  status = 200; payload = { emailGate: true }; assert.equal((await read()).reason, 'email');
  payload = {}; assert.equal((await read()).reason, 'server');
  payload = { species: [{ name: 'Abra', speciesId: 63, shiny: 5 }] };
  assert.equal((await read({ browse: 'species' })).data.species[0].shiny, 5);
  context.fetch = async () => { P.api['/api/characters/me'].character.id = 'trainer2'; return { ok: true, json: async () => ({ listings: [] }) }; };
  assert.equal((await read()).reason, 'changed');
  context.location.pathname = '/login'; assert.equal((await read()).reason, 'offline');
  const groupCalls = [];
  const groupRead = async script => {
    const q = JSON.parse(script.match(/\}\)\((\{[^\n]*?\}),/)[1]);
    groupCalls.push(q);
    const start = (Number(q.page) - 1) * 12;
    const listings = Array.from({ length: 24 }, (_, i) => ({ id: q.speciesId + ':' + i, speciesId: Number(q.speciesId), kind: 'pokemon', price: i * 3 + Number(q.speciesId) - 63, at: new Date(Date.now() - (i * 3 + Number(q.speciesId) - 63) * 1000).toISOString() }));
    return { ok: true, data: { cid: 'trainer1', listings: listings.slice(start, start + 12), total: 24, pages: 2 } };
  };
  const firstGroup = await M.readPokemonGroup(groupRead, { speciesId: 63, sort: 'price-asc', page: 1, ivMin: 150, shiny: true }, 'trainer1', chain);
  const secondGroup = await M.readPokemonGroup(groupRead, { speciesId: 63, sort: 'price-asc', page: 2, ivMin: 150, shiny: true }, 'trainer1', chain);
  assert.equal(firstGroup.data.total, 72); assert.equal(firstGroup.data.pages, 6);
  assert.deepEqual(firstGroup.data.listings.map(x => x.price), Array.from({ length: 12 }, (_, i) => i));
  assert.deepEqual(secondGroup.data.listings.map(x => x.price), Array.from({ length: 12 }, (_, i) => i + 12));
  assert.equal(groupCalls.every(x => x.ivMin === '150' && x.shiny === '1'), true);
  assert.equal((await M.readPokemonGroup(async () => ({ ok: false, reason: 'limited' }), { speciesId: 63 }, 'trainer1', chain)).reason, 'limited');
  assert.equal((await M.readPokemonGroup(async () => ({ ok: true, data: { cid: 'other', listings: [] } }), { speciesId: 63 }, 'trainer1', chain)).reason, 'changed');
  console.log('ok global-market: filtros, paginação, consulta GET, isolamento de sessão e respostas inválidas');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
