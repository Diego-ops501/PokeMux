const fs = require('fs');
const path = require('path');
const b = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let fail = 0;
const ok = (v, m) => { if (v) console.log('OK  ', m); else { console.error('FAIL', m); fail = 1; } };

const a = b.indexOf('function checkStall(i, r, w)');
const z = b.indexOf('  const lastRareDrops', a);
const src = b.slice(a, z);
let now = 1_000_000;
const DateFake = { now: () => now };
const lastK = [], lastKT = [], stallOn = [], stallSlug = [], stallCid = [], stallReload = [], huntRecovery = [];
const logs = [], alerts = [];
const checkStall = new Function('Date', 'lastK', 'lastKT', 'stallOn', 'stallSlug', 'stallReload', 'huntRecovery', 'stallCid',
  'HUNT_STALL_MS', 'HUNT_RELOAD_COOLDOWN', 'alertsOn', 'alerta', 'window', src + ';return checkStall;')(
    DateFake, lastK, lastKT, stallOn, stallSlug, stallReload, huntRecovery, stallCid,
    600e3, 1200e3, true, (i, k) => alerts.push([i, k]), { pokeAPI: { logError: (...x) => logs.push(x) } });

const panel = (url = 'https://poke.idleworld.online/play') => ({
  reloads: 0, getURL: () => url,
  reloadIgnoringCache() { this.reloads++; }, reload() { this.reloads++; }
});
const hunt = (extra = {}) => ({ live: true, hunting: true, slug: 'nightmare_beedrill', kills: 25, ...extra });

console.log('\n--- watchdog so age durante hunt confirmada ---');
{
  const w = panel();
  checkStall(0, hunt({ hunting: false }), w); now += 2_000_000; checkStall(0, hunt({ hunting: false }), w);
  ok(w.reloads === 0, 'parado propositalmente na cidade/mercado: nunca recarrega');
  checkStall(0, hunt({ slug: 'cerulean' }), w); now += 2_000_000; checkStall(0, hunt({ slug: 'cerulean' }), w);
  ok(w.reloads === 0, 'slug de cidade tambem e bloqueado mesmo se um estado antigo disser hunting');
  const login = panel('https://poke.idleworld.online/login');
  checkStall(1, hunt(), login); now += 2_000_000; checkStall(1, hunt(), login);
  ok(login.reloads === 0, 'login/captcha nunca e recarregado por falta de kills');
  const zero = panel(); now = 7_000_000;
  checkStall(3, hunt({ kills: 0 }), zero); now += 601_000; checkStall(3, hunt({ kills: 0 }), zero);
  ok(zero.reloads === 1, 'hunt confirmada que travou antes do primeiro abate tambem e recuperada');
}

console.log('\n--- hunt travada: recarrega sem cache e prepara retorno ---');
{
  const w = panel();
  now = 10_000_000;
  ok(checkStall(2, hunt(), w) === false, 'primeira leitura apenas cria a linha de base');
  now += 599_000;
  ok(checkStall(2, hunt(), w) === false && w.reloads === 0, 'antes de 10 minutos nao interfere');
  now += 2_000;
  ok(checkStall(2, hunt(), w) === true && w.reloads === 1, 'apos 10 minutos sem abate recarrega uma vez');
  ok(huntRecovery[2] && huntRecovery[2].slug === 'nightmare_beedrill', 'guarda a hunt confirmada para retomar depois do reload');
  ok(alerts.some(x => x[0] === 2 && x[1] === 'msgStalled') && logs.length > 0, 'avisa e registra o motivo');
  now += 60_000;
  checkStall(2, hunt(), w);
  ok(w.reloads === 1, 'cooldown impede loop de reload');
}

console.log('\n--- progresso e saida voluntaria rearmam com seguranca ---');
{
  const w = panel();
  now += 30_000;
  checkStall(2, hunt({ kills: 26 }), w);
  now += 700_000;
  checkStall(2, hunt({ kills: 27 }), w);
  ok(w.reloads === 0, 'abates novos zeram o cronometro');
  checkStall(2, hunt({ hunting: false, kills: 27 }), w);
  now += 2_000_000;
  checkStall(2, hunt({ hunting: false, kills: 27 }), w);
  ok(w.reloads === 0, 'sair da hunt zera a observacao');
}

console.log('\n--- sinais coletados do jogo ---');
ok(b.includes("['set-city','leave-hunt','exit-hunt'].includes(q.type)") && b.includes('P.hunting=false'), 'comando de sair para cidade desativa a hunt imediatamente');
ok(b.includes("m.type==='field-init'") && b.includes('P.hunting=true;P.huntSince=Date.now()'), 'field-init confirma que realmente entrou em uma hunt');
ok(b.includes('hunting:P.hunting===true') && b.includes('lastKillT:+S.lastKillT||0'), 'estado do watchdog vem do coletor, nao de elementos visuais frageis');
ok(b.includes('const rec = huntRecovery[i]') && b.includes('recOk || voltaComum'), 'recarga do watchdog retoma a hunt mesmo com a opcao experimental desligada');

console.log(fail ? '\nFALHOU' : '\nTODOS PASSARAM');
process.exit(fail);
