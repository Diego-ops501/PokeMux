(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxHuntRecommendations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const known = value => value != null && value !== '' && Number.isFinite(Number(value));
  const validSlug = value => /^[a-z0-9_-]{1,60}$/i.test(String(value || ''))
    && !['cerulean', 'pewter', 'viridian', 'cassino', 'arena_pvp'].includes(String(value).toLowerCase());
  const amplify = value => value > 1 ? 1 + (value - 1) * 1.5 : value < 1 ? value / 1.5 : value;

  const typeAliases = {
    NORMAL:['normal'], FIRE:['fire','fogo','fuego'], WATER:['water','agua'], ELECTRIC:['electric','eletrico','electrico'],
    GRASS:['grass','grama','planta'], ICE:['ice','gelo','hielo'], FIGHTING:['fighting','lutador','luta','lucha'],
    POISON:['poison','veneno'], GROUND:['ground','terra','tierra'], FLYING:['flying','voador','volador'],
    PSYCHIC:['psychic','psiquico'], BUG:['bug','inseto','insecto'], ROCK:['rock','pedra','roca'],
    GHOST:['ghost','fantasma'], DRAGON:['dragon','dragao'], DARK:['dark','sombrio','noturno','siniestro'],
    STEEL:['steel','aco','acero'], FAIRY:['fairy','fada','hada']
  };
  const normalized = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function dayBonus(events, now = Date.now()) {
    for (const event of Array.isArray(events) ? events : []) {
      if (!event || event.key !== 'type-of-day') continue;
      const until = typeof event.until === 'number' ? event.until : Date.parse(event.until);
      if (!Number.isFinite(until) || until <= now) continue;
      const label = String(event.name || '').split(':').pop().trim();
      const type = Object.keys(typeAliases).find(t => typeAliases[t].includes(normalized(event.pokemonType || event.typeName || label)));
      if (!type) continue;
      const desc = normalized(event.desc);
      const percent = kind => { const m = desc.match(new RegExp('\\+([0-9]+(?:[.,][0-9]+)?)%\\s*(?:de\\s*)?'+kind));return m ? Number(m[1].replace(',','.')) : 0; };
      return { type, label, until, xp:percent('xp'), loot:percent('loot') };
    }
    return null;
  }
  function bestForDay(rows, day) {
    if (!day || day.until <= Date.now()) return null;
    return (rows || []).find(r => [r.hunt.t1,r.hunt.t2].some(t => String(t || '').toUpperCase() === day.type)) || null;
  }

  function selectAccount({ requested, expanded, focused, preferred, accounts }) {
    const available = i => Number.isInteger(i) && accounts[i] && !accounts[i].off;
    // O botão da própria conta mantém a escolha explícita, inclusive quando está desconectada.
    if (available(requested)) return requested;
    const connected = i => available(i) && accounts[i].live;
    return [expanded, focused, preferred, ...accounts.map((_, i) => i)].find(connected)
      ?? accounts.findIndex(a => !a.off);
  }

  // O menu do mundo mantém o callback oficial de viagem nas propriedades React,
  // mesmo fechado. Usá-lo também troca o mapa e instala os listeners da hunt.
  function findNavigation(document) {
    const roots = new Set();
    for (const el of document.querySelectorAll('*')) {
      const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
      if (!key) continue;
      let root = el[key];
      while (root && root.return) root = root.return;
      if (!root || roots.has(root)) continue;
      roots.add(root);
      const stack = [root], seen = new Set();
      const scan = (p, depth) => {
        if (!p || depth > 4) return null;
        if (typeof p.currentSlug === 'string' && typeof p.onSelect === 'function' && Number.isFinite(p.playerLevel)) return p;
        for (const child of Array.isArray(p.children) ? p.children : [p.children]) {
          const found = child && child.props && scan(child.props, depth + 1);
          if (found) return found;
        }
        return null;
      };
      while (stack.length && seen.size < 20000) {
        const fiber = stack.pop();
        if (!fiber || seen.has(fiber)) continue;
        seen.add(fiber);
        const found = scan(fiber.memoizedProps, 0);
        if (found) return found;
        stack.push(fiber.child, fiber.sibling);
      }
    }
    return null;
  }

  // Não usa valor de venda do Pokémon como loot: capturas precisam de uma medição própria.
  function lootValue(drops, items) {
    if (!Array.isArray(drops) || !drops.length || !Array.isArray(items)) return null;
    let total = 0;
    for (const drop of drops) {
      if (!drop || typeof drop !== 'object' || !known(drop.minQty) || !known(drop.maxQty)) return null;
      const probability = known(drop.probability) ? drop.probability : drop.chanceUnit === 'fraction' ? drop.chance : null;
      if (!known(probability)) return null;
      const item = items.find(it => it && it.id === drop.itemId);
      if (!item || !known(item.npcPrice)) return null;
      const chance = Number(probability), min = Number(drop.minQty), max = Number(drop.maxQty);
      // Só aceita probabilidades explícitas; não adivinha se a unidade é percentual.
      if (chance < 0 || chance > 1 || min < 0 || max < min || Number(item.npcPrice) < 0) return null;
      total += chance * (min + max) / 2 * Number(item.npcPrice);
    }
    return total;
  }

  function rank({ attacker, hunts, offense, project, moves, effectiveness, measurements, objective = 'xp', day, potion, threshold = 50 }) {
    const dollars = objective === 'gold';
    if (!attacker || !(attacker.tlv > 0) || !(attacker.level > 0)) return [];
    const own = { ...project(attacker.sp, attacker.level, attacker.q, attacker.ivt), ...attacker.stats };
    if (!(own.hp > 0 && own.def > 0 && own.spd > 0)) return [];
    const rows = [], seen = new Set();
    for (const hunt of hunts || []) {
      if (!validSlug(hunt.sl) || hunt.blocked === true || seen.has(hunt.sl) || !(hunt.level > 0) || hunt.level > attacker.tlv || (!dollars && !(hunt.xp > 0))) continue;
      seen.add(hunt.sl);
      const attack = offense(attacker, hunt);
      if (!attack || !(attack.ritmo > 0)) continue;
      const wild = project(hunt.sp, hunt.level, 1, 96);
      if (!wild) continue;
      const learned = moves(hunt.sp);
      let incoming = Array.isArray(learned) && learned.length ? 0 : null;
      for (const move of learned || []) {
        if (move[6] || move[5] > hunt.level || !(move[1] > 0) || !(move[4] > 0)) continue;
        const physical = move[3] === 'P';
        const eff = amplify(effectiveness(move[2], attacker.t1, attacker.t2));
        const stab = [hunt.t1, hunt.t2].includes(move[2]) ? 1.5 : 1;
        const damage = 0.1 * move[1] * eff * stab * number(physical ? wild.atk : wild.spa)
          / Math.max(1, number(physical ? own.def : own.spd));
        incoming = Math.max(incoming == null ? 0 : incoming, damage);
      }
      // Estima uma troca de golpes por ataque, sem supor conhecimento da cadência do servidor.
      const exposure = incoming == null ? null : incoming / own.hp / attack.ritmo;
      const safety = exposure == null ? 0.75 : 1 / (1 + 2 * exposure);
      const measured = measurements && (measurements[String(hunt.sl).replace(/[_-]+/g, ' ').toLowerCase()]
        || measurements[String(hunt.name).replace(/[_-]+/g, ' ').toLowerCase()]);
      rows.push({ hunt, attack, incoming, exposure, safety, measured: measured || null });
    }
    const exact = rows.filter(r => r.measured && !r.measured.estimated);
    const calibrated = exact.length ? exact : rows.filter(r => r.measured);
    const anchors = calibrated.filter(r => r.measured.xph > 0 && r.attack.xph > 0)
      .map(r => r.measured.xph / r.attack.xph).sort((a, b) => a - b);
    const anchor = anchors.length ? anchors[Math.floor(anchors.length / 2)] : 0;
    // Cadência de abates é independente de XP e de dólares. Sem amostra não inventa abates/h.
    const killAnchors = calibrated.filter(r => r.measured.kph > 0)
      .map(r => r.measured.kph / r.attack.ritmo).sort((a, b) => a - b);
    const killAnchor = killAnchors.length ? killAnchors[Math.floor(killAnchors.length / 2)] : 0;
    rows.forEach(r => {
      const activeDay = day && day.until > Date.now() && [r.hunt.t1, r.hunt.t2].includes(day.type);
      r.kph = r.measured && r.measured.kph > 0 ? r.measured.kph : killAnchor > 0 ? r.attack.ritmo * killAnchor : null;
      r.xph = r.measured && r.measured.xph > 0 ? r.measured.xph
        : killAnchor > 0 ? r.kph * number(r.hunt.xp) * (1 + (activeDay ? number(day.xp) : 0) / 100)
        : anchor > 0 ? r.attack.xph * anchor : null;
      r.gph = null;
      r.goldSource = 'unknown';
      // Poção informada permite uma estimativa conservadora sem presumir regeneração natural.
      const modeledPotion = potion !== undefined;
      const heal = number(potion && potion.heal);
      r.potionsPerKill = modeledPotion && r.incoming != null
        ? heal > 0 ? r.incoming / r.attack.ritmo / heal : 0 : null;
      r.potionsPerHour = r.kph != null && r.potionsPerKill != null ? r.potionsPerKill * r.kph : null;
      if (dollars) {
        if (!modeledPotion && r.measured && known(r.measured.gph)) {
          // O saldo do analyzer já desconta suprimentos e inclui capturas: não descontar duas vezes.
          r.gph = Number(r.measured.gph);
          r.goldSource = r.measured.estimated ? 'estimated' : 'measured';
        } else if (modeledPotion && r.kph != null && r.potionsPerKill != null) {
          const loot = r.measured && known(r.measured.lootPerKill) ? Number(r.measured.lootPerKill)
            : known(r.hunt.lootValue) ? Number(r.hunt.lootValue) * (1 + (activeDay ? number(day.loot) : 0) / 100) : null;
          if (loot != null && (!potion || known(potion.price))) {
            r.gph = r.kph * (loot - r.potionsPerKill * number(potion && potion.price));
            r.goldSource = 'estimated';
          }
        }
      }
      // Somente a métrica escolhida pontua. Risco é uma condição de viabilidade, não um bônus.
      r.score = dollars ? r.gph : r.xph == null ? r.attack.xph * (1 + (activeDay ? number(day.xp) : 0) / 100) : r.xph;
      r.risk = r.exposure == null ? 'unknown' : r.exposure >= 1 ? 'high' : r.exposure >= 0.35 ? 'medium' : 'low';
      r.viable = r.risk !== 'high' || !!(r.measured && r.measured.kph > 0);
      if (modeledPotion && r.incoming != null) {
        const hpAtThreshold = own.hp * Math.max(1, Math.min(99, number(threshold))) / 100;
        r.viable = potion ? heal >= r.incoming && hpAtThreshold > r.incoming : r.exposure < 1;
      }
    });
    // Sem dados financeiros a hunt permanece identificada, mas nunca vence um resultado conhecido.
    return rows.sort((a, b) => Number(b.viable) - Number(a.viable)
      || Number(b.score != null) - Number(a.score != null)
      || (a.score != null && b.score != null ? b.score - a.score : 0)
      || a.hunt.sl.localeCompare(b.hunt.sl));
  }

  function travelScript(expected, hunt) {
    if (!expected || !expected.cid || !expected.id || !validSlug(hunt && hunt.sl) || !(hunt.level > 0)) return null;
    const input = JSON.stringify({ cid: String(expected.cid), id: String(expected.id), level: number(expected.level),
      slug: hunt.sl, name:String(hunt.name || hunt.sl), minLevel: number(hunt.level) });
    return `(async()=>{const E=${input};const P=window.__poke;const navigation=${findNavigation.toString()};
      const check=()=>{if(!P||location.origin!=='https://poke.idleworld.online'||location.pathname!=='/play')return 'offline';
        const c=P.api&&P.api['/api/characters/me']&&P.api['/api/characters/me'].character;
        const p=((P.ws&&P.ws.pokes&&P.ws.pokes.list)||[]).find(p=>p.team&&p.leader);
        if(!c||String(c.id)!==E.cid||!p||String(p.id)!==E.id||+p.level!==E.level)return 'changed';
        if(+c.level<E.minLevel)return 'locked';if(!(p.hp>0))return 'fainted';
        if(!P.sock||P.sock.readyState!==1)return 'offline';return '';};
      const failure=check();if(failure)return {ok:false,reason:failure};
      const nav=navigation(document);if(!nav)return {ok:false,reason:'navigation'};
      if(nav.currentSlug===E.slug&&P.hunting&&P.lastSlug===E.slug)return {ok:true,already:true};
      const before=P.fiT||0;let requested=false;
      try{await nav.onSelect(E.slug,E.name);requested=true;}catch(e){return {ok:false,reason:'navigation'};}
      return await new Promise(resolve=>{const start=Date.now();const timer=setInterval(()=>{
        const error=check();if(error||(Date.now()-start>10000)){clearInterval(timer);resolve({ok:false,reason:error||'unconfirmed',requested});return;}
        const current=navigation(document);
        if(current&&current.currentSlug===E.slug&&P.hunting&&P.lastSlug===E.slug&&(P.fiT||0)>before){clearInterval(timer);resolve({ok:true,requested});}
      },200);});})()`;
  }
  return { rank, lootValue, validSlug, travelScript, selectAccount, findNavigation, dayBonus, bestForDay };
});
