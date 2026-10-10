// Render the real market interface with fictional data, without user sessions.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
app.setPath('userData', path.join(os.tmpdir(), 'pokemux-docs-' + process.pid));
const temp = path.join(app.getPath('userData'), 'preview.html');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1536, height: 940, useContentSize: true, webPreferences: { backgroundThrottling: false } });
  try {
    const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const styles = source.match(/<style>([\s\S]*?)<\/style>/)[1];
    const topbar = source.slice(source.indexOf('<div id="topbar">'), source.indexOf('<div id="grid">'));
    fs.mkdirSync(path.dirname(temp), { recursive: true });
    fs.writeFileSync(temp, `<!doctype html><html><head><meta charset="utf-8"><base href="${pathToFileURL(root + path.sep).href}"><style>${styles}</style><link rel="stylesheet" href="src/renderer/toolbar.css"><link rel="stylesheet" href="src/renderer/global-market.css"><link rel="stylesheet" href="src/renderer/workspace.css"></head><body>${topbar}<div id="grid"></div><script src="src/renderer/workspace.js"></script><script src="src/domain/pokemon-state.js"></script><script src="src/domain/global-market.js"></script><script src="src/domain/market-alerts.js"></script><script src="src/renderer/global-market.js"></script></body></html>`);
    await win.loadFile(temp);
    await win.webContents.executeJavaScript(`(async () => {
      const M = PokeMuxGlobalMarket, A = PokeMuxMarketAlerts;
      const demoNames = ['Azusojava', 'Aurora', 'Boreal', 'Citrino'];
      PokeMuxWorkspace.mount({ state: () => ({ lang: 'pt', eco: true, accounts: demoNames.map((name,i) => ({ name, live: true, color: ['#b77aff','#74b9ff','#59dba0','#dfba65'][i] })) }), resize() {}, focus() {}, mode() {}, analyze() {}, inventory() {}, market: tab => window.docsMarket.open(tab) });
      const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
      document.querySelector('#appVer').textContent = 'v${require('../package.json').version}';
      document.querySelector('#accounts').textContent = 'Treinadores';
      document.querySelector('#reloadAll').textContent = 'Atualizar tudo';
      document.querySelector('#statsBtn').textContent = 'Análise';
      document.querySelector('#cardsBtn').textContent = 'Resumo';
      document.querySelector('#recommendBtn').textContent = 'Recomendar hunt';
      const definitions = [{ kind: 'pokemon', speciesId: 1, name: 'Bulbasaur', evolvesToId: 2 }, { kind: 'pokemon', speciesId: 2, name: 'Ivysaur', evolvesToId: 3 }, { kind: 'pokemon', speciesId: 3, name: 'Venusaur' }];
      const items = [{ kind: 'item', refId: 44417, name: 'Strange Pheromone', icon: '/assets/items/strange_pheromone.png' }, { kind: 'item', refId: 70000, name: 'Bronze Boss Token', icon: '/assets/items/bronze_boss_token.png' }];
      const diamonds = { kind: 'diamonds', refId: 0, name: 'Diamonds', icon: '/assets/market/diamonds.png' };
      const date = mins => new Date(Date.now() - mins * 60000).toISOString();
      const pokemon = Array.from({ length: 9 }, (_, i) => ({ id: 'demo-poke-' + i, kind: 'pokemon', speciesId: i % 3 + 1, name: definitions[i % 3].name, level: 30 + i, ivTotal: 160 + i, quality: 1.8, power: 2300 + i * 120, currency: i % 2 ? 'GOLD' : 'DIAMONDS', price: i % 2 ? 2400000 + i * 200000 : 3 + i, shiny: false, at: date(12 + i * 31), type1: 'GRASS', type2: 'POISON', stats: { hp: 110, atk: 64, def: 59, spAtk: 88, spDef: 70, speed: 60 } }));
      const itemOffers = [
        { ...diamonds, id: 'demo-dia', currency: 'GOLD', price: 2340000, quantity: 25, at: date(20) },
        { ...items[0], id: 'demo-pher-dollar', currency: 'GOLD', price: 31000000, quantity: 10, at: date(22) },
        { ...items[0], id: 'demo-pher-dia', currency: 'DIAMONDS', price: 14, quantity: 5, at: date(25) },
        { ...items[1], id: 'demo-boss-dollar', currency: 'GOLD', price: 15000000, quantity: 8, at: date(40) },
        { ...items[1], id: 'demo-boss-dia', currency: 'DIAMONDS', price: 7, quantity: 4, at: date(70) }
      ];
      const owned = [{ ...pokemon[2], id: 'owned-venusaur', level: 35, ivTotal: 164, team: true }, { ...items[0], id: 'owned-pheromone', quantity: 12 }, { ...items[1], id: 'owned-boss', quantity: 8 }, { ...diamonds, id: 'owned-diamonds', quantity: 50 }];
      const rules = [A.normalize({ id: 'demo-rule', cid: 'demo-character-0', account: 0, accountName: demoNames[0], name: 'Strange Pheromone', kind: 'item', refId: 44417, currency: 'DIAMONDS', priceMax: 12 })];
      // Suppress monitoring in the documentation fixture. No authenticated reads or notifications.
      A.create = () => ({ setRules() {}, stop() {}, check() {}, state: () => ({ ready: true, checkedAt: Date.now(), error: '' }) });
      const read = async (_account, script) => {
        const query = JSON.parse(script.match(/\\}\\)\\((\\{[^\\n]*?\\}),/)[1]);
        let list = query.browse === 'pokemon' ? pokemon.filter(x => !query.speciesId || x.speciesId === Number(query.speciesId)) : [...pokemon, ...itemOffers];
        if (query.browse === 'pokemon') list = M.filterListings(list, { ...query, pokemonOnly: true });
        return { ok: true, data: { cid: 'demo-character-' + _account, name: demoNames[_account], gold: 4500000, diamonds: 50, listings: list, total: list.length, pages: 1, species: definitions.map(x => ({ ...x, total: 3, minDia: 3 })), catalog: { items, balls: [], diamonds }, owned, ownedReady: true, alertCatalog: definitions, requests: [{ ...pokemon[2], id: 'demo-request', currency: 'GOLD', price: 2000000 }], mine: [], myRequests: [], history: [] } };
      };
      window.docsMarket = PokeMuxMarketUI.mount({ load: key => key === 'marketAlerts' ? JSON.stringify(rules) : '', save() {}, language: () => 'pt', preferred: () => 0, marketSnapshotOptions: {enabled:false}, marketReaderOptions: {interval:0}, accounts: async () => Array.from({length:4},(_,i)=>({cid:'demo-character-'+i,focused:i===0,live:true,off:false,name:demoNames[i]})), read, rememberFocus() {}, notifyMarket() {}, sprite: (id, shiny) => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + (shiny ? 'shiny/' : '') + id + '.png' });
      await docsMarket.open(); await pause(40);
      document.querySelector('[data-category="Pokemon"]').click(); await pause(40);
      const iv = document.querySelector('#mkIvMin'); iv.value = '150'; iv.dispatchEvent(new Event('input', { bubbles: true })); await pause(800);
      document.querySelector('[data-listing="demo-poke-2"]').click();
    })()`);
    const settleImages = () => win.webContents.executeJavaScript(`Promise.race([Promise.all([...document.images].filter(x => x.getBoundingClientRect().height > 0).map(x => x.decode().catch(() => {}))), new Promise(resolve => setTimeout(resolve, 6000))]).then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))`);
    const screenshot = async (name, rect) => {
      await settleImages();
      fs.writeFileSync(path.join(root, 'docs', name + '.png'), (await win.webContents.capturePage(rect)).toPNG());
      console.log('Rendered docs/' + name + '.png');
    };
    await screenshot('mercado-global');
    await win.webContents.executeJavaScript(`document.querySelector('[data-tab="compare"]').click(); new Promise(resolve => setTimeout(resolve, 80))`);
    await win.webContents.executeJavaScript(`document.querySelector('[data-owned="0|owned-venusaur"]').click(); new Promise(resolve => setTimeout(resolve, 80))`);
    await screenshot('comparacao-mercado');
    await win.webContents.executeJavaScript(`document.querySelector('[data-tab="alerts"]').click(); new Promise(resolve => setTimeout(resolve, 80))`);
    await win.webContents.executeJavaScript(`document.querySelector('#mkAlertKind').value = 'pokemon'; document.querySelector('#mkAlertKind').dispatchEvent(new Event('change', { bubbles: true }));`);
    await win.webContents.executeJavaScript(`
      const input = document.querySelector('#mkAlertSearch'); input.value = 'Venus'; input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('[data-alert-target="pokemon:3"]').click();
      document.querySelector('#mkAlertEvolutions').click();
      document.querySelector('[name="priceMax"]').value = '5'; document.querySelector('[name="currency"]').value = 'DIAMONDS';
      document.querySelector('[name="ivMin"]').value = '160'; document.querySelector('[name="qMin"]').value = '1.7';
    `);
    await screenshot('alertas-mercado');
    await win.webContents.executeJavaScript('docsMarket.close()');
    await screenshot('barra-superior', { x: 0, y: 0, width: 1536, height: 72 });
    win.destroy(); app.exit(0);
  } catch (error) { console.error(error); win.destroy(); app.exit(1); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
});
