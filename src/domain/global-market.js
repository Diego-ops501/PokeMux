(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxGlobalMarket = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CATEGORIES = ['All', 'Items', 'Stones', 'Poke Balls', 'Diamonds', 'Pokemon'];
  const SORTS = ['recent', 'price-asc', 'price-desc', 'iv-desc', 'power-desc', 'level-desc', 'quality-desc'];
  const GRADES = ['Fraca', 'Comum', 'Incomum', 'Rara', 'Épica', 'Lendária', 'Mítica', 'Anciã', 'Divina'];
  const TYPES = ['NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE', 'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY'];
  const normalized = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rarity = q => GRADES[q >= 4 ? 8 : q >= 3 ? 7 : q >= 2 ? 6 : q >= 1.7 ? 5 : q >= 1.5 ? 4 : q >= 1.3 ? 3 : q >= 1.1 ? 2 : q >= 1 ? 1 : 0];

  function query(options = {}) {
    const out = {};
    if (options.browse === 'species') return { browse: 'species' };
    if (options.browse !== 'pokemon') return { category: CATEGORIES.includes(options.category) ? options.category : 'All' };
    out.browse = 'pokemon';
    out.page = String(Math.max(1, Math.min(100000, Math.trunc(Number(options.page)) || 1)));
    out.sort = SORTS.includes(options.sort) ? options.sort : 'recent';
    const species = Number(options.speciesId);
    if (Number.isSafeInteger(species) && species > 0 && species < 1000000) out.speciesId = String(species);
    else if (String(options.q || '').trim()) out.q = String(options.q).trim().slice(0, 120);
    if (options.shiny === true || options.shiny === '1') out.shiny = '1';
    if (TYPES.includes(options.type)) out.type = options.type;
    const grades = (Array.isArray(options.gradesOff) ? options.gradesOff : String(options.gradesOff || '').split(',')).filter(g => GRADES.includes(g));
    if (grades.length) out.gradesOff = [...new Set(grades)].join(',');
    for (const key of ['ivMin', 'ivMax', 'lvMin', 'lvMax', 'qMin', 'qMax']) {
      if (options[key] == null || String(options[key]).trim() === '') continue;
      const n = Number(String(options[key]).replace(',', '.'));
      const max = key.startsWith('iv') ? 192 : key.startsWith('lv') ? 100000 : 100;
      if (Number.isFinite(n) && n >= (key.startsWith('lv') ? 1 : 0) && n <= max) out[key] = String(n);
    }
    return out;
  }

  // Self-contained so the same allowlist also runs inside the authenticated game frame.
  function sanitizeResponse(input) {
    const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
    const txt = (v, max = 160) => String(v == null ? '' : v).slice(0, max);
    const num = v => Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
    const arr = (v, max = 12000) => Array.isArray(v) ? v.slice(0, max) : [];
    const entry = value => {
      const x = obj(value), stats = obj(x.stats), out = {};
      for (const key of ['id', 'kind', 'name', 'type1', 'type2', 'currency', 'category', 'targetName', 'at']) out[key] = txt(x[key]);
      out.desc = txt(x.desc, 1200);
      out.icon = txt(x.icon || x.iconUrl, 400);
      for (const key of ['refId', 'speciesId', 'evolvesToId', 'level', 'ivTotal', 'quality', 'power', 'price', 'quantity', 'sellers', 'amount', 'total', 'minGold', 'minDia', 'npcPrice']) out[key] = x[key] == null ? null : num(x[key]);
      out.shiny = !!x.shiny;
      out.bought = !!x.bought;
      out.offer = !!x.offer;
      out.offerOnly = !!x.offerOnly;
      out.hasOffers = !!x.hasOffers;
      out.starter = !!x.starter;
      out.team = !!x.team;
      out.stats = Object.fromEntries(['hp', 'atk', 'def', 'spAtk', 'spDef', 'speed'].map(key => [key, stats[key] == null ? null : num(stats[key])]));
      out.tms = arr(x.tms, 24).map(v => txt(typeof v === 'object' && v ? v.name || v.id : v, 80));
      out.ids = arr(x.ids, 2000).map(v => txt(v, 100));
      return out;
    };
    const x = obj(input), catalog = obj(x.catalog), window = obj(x.pkWindow);
    const out = { catalog: {}, pkWindow: { cap: num(window.cap), more: !!window.more },
      total: num(x.total), pages: Math.max(1, num(x.pages)), cid: txt(x.cid, 100), name: txt(x.name, 60),
      gold: num(x.gold), diamonds: num(x.diamonds), isVip: x.isVip === true, emailGate: !!x.emailGate };
    for (const key of ['listings', 'mine', 'requests', 'myRequests', 'history', 'species', 'owned', 'alertCatalog']) out[key] = arr(x[key]).map(entry);
    out.ownedReady = x.ownedReady === true;
    out.species = arr(x.species).map(value => ({ ...entry(value), shiny: num(obj(value).shiny) }));
    for (const key of ['items', 'balls']) out.catalog[key] = arr(catalog[key], 2000).map(entry);
    out.catalog.diamonds = catalog.diamonds ? entry(catalog.diamonds) : null;
    return out;
  }

  function filterListings(list, filters = {}) {
    const needle = normalized(filters.q).trim();
    const off = Array.isArray(filters.gradesOff) ? filters.gradesOff : [];
    const result = (Array.isArray(list) ? list : []).filter(x => {
      if (needle && !normalized(x.name).includes(needle)) return false;
      if (filters.pokemonOnly && x.kind !== 'pokemon') return false;
      if (!filters.pokemonOnly) return true;
      if (filters.shiny && !x.shiny) return false;
      if (filters.type && filters.type !== x.type1 && filters.type !== x.type2) return false;
      if (off.includes(rarity(Number(x.quality)))) return false;
      return [['ivTotal', 'ivMin', 'ivMax'], ['level', 'lvMin', 'lvMax'], ['quality', 'qMin', 'qMax']].every(([field, min, max]) => {
        const value = Number(x[field]) || 0;
        return (filters[min] == null || filters[min] === '' || value >= Number(filters[min]))
          && (filters[max] == null || filters[max] === '' || value <= Number(filters[max]));
      });
    });
    const field = { 'price-asc': 'price', 'price-desc': 'price', 'iv-desc': 'ivTotal', 'power-desc': 'power', 'level-desc': 'level', 'quality-desc': 'quality' }[filters.sort];
    if (field) result.sort((a, b) => ((Number(a[field]) || 0) - (Number(b[field]) || 0)) * (filters.sort === 'price-asc' ? 1 : -1));
    return result;
  }

  function safeIcon(value) {
    try {
      let v = String(value || '');
      if (!v) return '';
      if (!v.startsWith('/') && !/^https?:/i.test(v)) v = '/assets/items/' + v;
      const u = new URL(v, 'https://poke.idleworld.online');
      if (u.protocol !== 'https:' || u.origin !== 'https://poke.idleworld.online' || !u.pathname.startsWith('/assets/') || /["'<>\\]/.test(v)) return '';
      return u.href;
    } catch { return ''; }
  }

  function listingTime(value, now = Date.now()) {
    if (value == null || String(value).trim() === '') return null;
    const raw = String(value).trim();
    const numeric = /^\d{10,13}$/.test(raw) ? Number(raw) : NaN;
    const timestamp = Number.isFinite(numeric) ? numeric < 1e12 ? numeric * 1000 : numeric : Date.parse(raw);
    if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp > now + 60000) return null;
    return { timestamp, minutes: Math.max(0, Math.floor((now - timestamp) / 60000)) };
  }

  function comparisonFilters(owned, tolerance = {}) {
    const out = { browse: 'pokemon', speciesId: owned.speciesId, shiny: !!owned.shiny, sort: 'price-asc' };
    if (tolerance.broad) return out;
    for (const [field, prefix, fallback, max] of [['ivTotal', 'iv', 10, 192], ['level', 'lv', 10, 100000], ['quality', 'q', .1, 100]]) {
      if (owned[field] == null || !Number.isFinite(Number(owned[field]))) continue;
      const delta = Number.isFinite(Number(tolerance[prefix])) ? Math.max(0, Math.min(max, Number(tolerance[prefix]))) : fallback;
      out[prefix + 'Min'] = +Math.max(prefix === 'lv' ? 1 : 0, Number(owned[field]) - delta).toFixed(2);
      out[prefix + 'Max'] = +Math.min(max, Number(owned[field]) + delta).toFixed(2);
    }
    return out;
  }

  function evolutionIds(speciesId, catalog = []) {
    const id = Number(speciesId);
    if (!Number.isSafeInteger(id) || id <= 0 || id >= 1000000) return [];
    const definitions = new Map(catalog.filter(x => Number.isSafeInteger(Number(x.speciesId)) && Number(x.speciesId) > 0 && Number(x.speciesId) < 1000000).map(x => [Number(x.speciesId), x]));
    const links = new Map(), successors = new Map();
    for (const [source, definition] of definitions) {
      const dest = Number(definition.evolvesToId);
      if (!Number.isSafeInteger(dest) || dest <= 0 || !definitions.has(dest)) continue;
      successors.set(source, dest);
      for (const [a, b] of [[source, dest], [dest, source]]) {
        if (!links.has(a)) links.set(a, []);
        links.get(a).push(b);
      }
    }
    const family = new Set(), pending = [id];
    while (pending.length && family.size < 64) {
      const current = pending.shift();
      if (family.has(current)) continue;
      family.add(current); pending.push(...(links.get(current) || []));
    }
    // Put pre-evolutions first, even when their Pokédex number is higher.
    const incoming = new Map([...family].map(x => [x, 0]));
    for (const source of family) if (family.has(successors.get(source))) incoming.set(successors.get(source), incoming.get(successors.get(source)) + 1);
    const ready = [...family].filter(x => !incoming.get(x)).sort((a, b) => a - b), result = [];
    while (ready.length) {
      const current = ready.shift(); result.push(current);
      const dest = successors.get(current);
      if (family.has(dest)) { incoming.set(dest, incoming.get(dest) - 1); if (!incoming.get(dest)) ready.push(dest); }
    }
    return [...result, ...[...family].filter(x => !result.includes(x)).sort((a, b) => a - b)];
  }

  // The game accepts one species per query. Merge sorted prefixes to make one
  // complete page across the selected species and its full evolution family.
  async function readPokemonGroup(read, options, expectedCid, catalog) {
    const ids = evolutionIds(options.speciesId, catalog);
    if (ids.length <= 1) return read(readScript(options, expectedCid));
    const page = Number(query({ ...options, browse: 'pokemon' }).page), size = 12;
    const groups = [];
    for (const speciesId of ids) {
      const rows = []; let first;
      for (let p = 1; p <= page; p++) {
        const response = await read(readScript({ ...options, browse: 'pokemon', speciesId, page: p }, expectedCid));
        if (!response || !response.ok) return response || { ok: false, reason: 'network' };
        const data = sanitizeResponse(response.data);
        if (data.cid !== String(expectedCid)) return { ok: false, reason: 'changed' };
        if (!first) first = data;
        rows.push(...data.listings);
        if (p >= data.pages) break;
      }
      groups.push({ data: first, rows });
    }
    const sort = options.sort, field = { 'price-asc': 'price', 'price-desc': 'price', 'iv-desc': 'ivTotal', 'power-desc': 'power', 'level-desc': 'level', 'quality-desc': 'quality' }[sort];
    const rows = groups.flatMap(x => x.rows).sort((a, b) => {
      const delta = field ? (Number(a[field]) - Number(b[field])) * (sort === 'price-asc' ? 1 : -1)
        : (listingTime(b.at)?.timestamp || 0) - (listingTime(a.at)?.timestamp || 0);
      // Stable ties retain each species' server order across page boundaries.
      return delta || 0;
    });
    const total = groups.reduce((sum, x) => sum + x.data.total, 0);
    return { ok: true, data: { ...groups[0].data, listings: rows.slice((page - 1) * size, page * size), total, pages: Math.max(1, Math.ceil(total / size)) } };
  }

  function comparable(list, owned, tolerance = {}) {
    if (!owned) return [];
    const filters = comparisonFilters(owned, tolerance);
    return (list || []).filter(x => {
      if (x.kind !== owned.kind) return false;
      if (x.kind !== 'pokemon') return x.refId != null && owned.refId != null && Number(x.refId) === Number(owned.refId);
      if (!(Number(owned.speciesId) > 0) || Number(x.speciesId) !== Number(owned.speciesId) || !!x.shiny !== !!owned.shiny) return false;
      return [['ivTotal', 'iv'], ['level', 'lv'], ['quality', 'q']].every(([field, prefix]) => filters[prefix + 'Min'] == null ||
        (x[field] != null && Number(x[field]) >= filters[prefix + 'Min'] && Number(x[field]) <= filters[prefix + 'Max']));
    });
  }

  function priceSummary(list) {
    const out = {};
    for (const currency of ['GOLD', 'DIAMONDS']) {
      const prices = (list || []).filter(x => x.currency === currency && !x.offerOnly && x.price != null && Number.isFinite(Number(x.price)) && Number(x.price) > 0).map(x => Number(x.price)).sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      out[currency] = { count: prices.length, min: prices.length ? prices[0] : null, max: prices.length ? prices[prices.length - 1] : null,
        median: prices.length ? prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2 : null };
    }
    return out;
  }

  function marketHighlights(list) {
    const available = (list || []).filter(x => !x.offerOnly && (x.quantity == null || Number(x.quantity) > 0));
    const minimum = match => {
      const prices = priceSummary(available.filter(match));
      return { gold: prices.GOLD.min, diamonds: prices.DIAMONDS.min };
    };
    return {
      diamond: minimum(x => x.kind === 'diamonds'),
      pheromone: minimum(x => x.kind === 'item' && Number(x.refId) === 44417),
      boss: minimum(x => x.kind === 'item' && Number(x.refId) === 70000)
    };
  }

  async function readInGame(params, expectedCid, sanitize, includeOwned, includeAlertCatalog) {
    const P = window.__poke;
    const character = () => P && P.api && P.api['/api/characters/me'] && P.api['/api/characters/me'].character;
    if (location.origin !== 'https://poke.idleworld.online' || location.pathname !== '/play' || !P || !character()) return { ok: false, reason: 'offline' };
    const cid = String(character().id || '');
    if (expectedCid && expectedCid !== cid) return { ok: false, reason: 'changed' };
    if (!P.auth) return { ok: false, reason: 'auth' };
    const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 12000);
    try {
      const response = await fetch('/api/game/market?' + new URLSearchParams(params), {
        method: 'GET', credentials: 'same-origin', headers: { Authorization: P.auth }, signal: abort.signal
      });
      if (!response.ok) return { ok: false, reason: response.status === 401 ? 'auth' : response.status === 403 ? 'denied' : response.status === 429 ? 'limited' : 'server', status: response.status };
      const data = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'server' };
      if (String(character() && character().id || '') !== cid) return { ok: false, reason: 'changed' };
      if (data.emailGate) return { ok: false, reason: 'email' };
      if (data.error) return { ok: false, reason: 'denied' };
      if (!Array.isArray(params.browse === 'species' ? data.species : data.listings)) return { ok: false, reason: 'server' };
      const ch = character();
      let alertCatalog = [];
      if (includeAlertCatalog) {
        try {
          const definitions = P.api['/game/creatures.json'] || await (await fetch('/game/creatures.json', { signal: abort.signal })).json();
          alertCatalog = (definitions.creatures || []).map(x => ({ kind: 'pokemon', name: x.name, speciesId: x.pokeId, evolvesToId: x.evolvesToId }));
        } catch {}
        if (String(character() && character().id || '') !== cid) return { ok: false, reason: 'changed' };
      }
      const owned = [];
      const ws = P.ws || {};
      if (includeOwned) {
        const definitions = new Map(((P.api['/game/items.json'] || {}).items || []).map(x => [Number(x.id), x]));
        const marketItems = new Map(((data.catalog || {}).items || []).map(x => [Number(x.refId), x]));
        for (const x of (ws.inventory || {}).items || []) {
          const def = marketItems.get(Number(x.itemId)) || definitions.get(Number(x.itemId));
          if (def && Number(x.quantity) > 0) owned.push({ ...def, id: 'item:' + x.itemId, kind: 'item', refId: x.itemId, quantity: x.quantity });
        }
        for (const x of (ws.balls || {}).catalog || []) {
          const quantity = ((ws.balls || {}).counts || {})[x.id];
          if (Number(quantity) > 0 && !x.infinite) owned.push({ ...x, id: 'ball:' + x.id, kind: 'ball', refId: x.id, quantity });
        }
        const numeric = v => { if (v == null || v === '') return null; const m = String(v).match(/[0-9]+([.,][0-9]+)?/); return m ? Number(m[0].replace(',', '.')) : null; };
        for (const x of (ws.pokes || {}).list || []) owned.push({ ...x, id: 'pokemon:' + x.id, kind: 'pokemon', speciesId: x.speciesId || x.pokeId,
          ivTotal: numeric(x.ivTotal), quality: numeric(x.quality), level: numeric(x.level) });
        const diamond = (data.catalog || {}).diamonds;
        const balance = (P.api['/api/game/diamonds'] || {}).diamonds ?? ch.diamonds;
        if (diamond && Number(balance) > 0) owned.push({ ...diamond, id: 'diamonds', quantity: balance });
      }
      return { ok: true, data: sanitize({ ...data, cid, name: ch.name, gold: ch.gold,
        owned, alertCatalog, ownedReady: includeOwned && !!ws.inventory && !!ws.pokes && !!ws.balls,
        diamonds: (P.api['/api/game/diamonds'] || {}).diamonds ?? ch.diamonds,
        isVip: (P.ws.autohelper || {}).isVip }) };
    } catch (error) { return { ok: false, reason: error && error.name === 'AbortError' ? 'timeout' : 'network' }; }
    finally { clearTimeout(timer); }
  }

  function readScript(options, expectedCid = '') {
    return '(' + readInGame.toString() + ')(' + JSON.stringify(query(options)) + ','
      + JSON.stringify(String(expectedCid).slice(0, 100)) + ',(' + sanitizeResponse.toString() + '),' + (options && options.includeOwned === true) + ',' + (options && options.includeAlertCatalog === true) + ')';
  }

  return { CATEGORIES, SORTS, GRADES, TYPES, normalized, rarity, query, sanitizeResponse, filterListings, safeIcon, listingTime, comparisonFilters, comparable, priceSummary, marketHighlights, evolutionIds, readPokemonGroup, readScript };
});
