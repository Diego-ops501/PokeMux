'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const ivHelper = fs.readFileSync(path.join(root, 'presets', 'justpokedex.js'), 'utf8');

let checks = 0;
function ok(value, message) {
  if (!value) throw new Error('FALHOU: ' + message);
  checks++;
  console.log('OK  ', message);
}

console.log('\n--- Voz local e eventos anunciados ---');
ok(html.includes("if (sndShinyOn) beepShiny()") && html.includes("if (sndShinyOn) beepShiny(true)") && !html.includes('sndShinyOn && !voiceOn'), 'acorde de shiny funciona junto com a voz');
ok(html.includes("if (_ac.state === 'suspended') await _ac.resume()") && html.includes("_ac.state !== 'running'"), 'WebAudio suspenso é reativado antes do alerta');
ok(html.includes('function beepVoiceFallback()') && html.includes("logError('audio-alerta'") && html.includes("fim('tempo esgotado')"), 'falha ou travamento da voz gera fallback e diagnóstico');
ok(html.includes('new SpeechSynthesisUtterance(item.text)') && html.includes("u.lang = lang === 'en' ? 'en-US'"), 'usa a voz local do sistema e escolhe o idioma');
ok(!html.includes('shinyAppear:') && !html.includes("alerta(i, 'msgShiny',"), 'aparição de shiny não dispara voz nem Windows');
ok(!html.includes('shinyFail:') && !html.includes("falaAlerta('shinyFail'"), 'falha de captura de shiny não dispara voz');
ok(html.includes("ballsLow: `As Pokébolas estão acabando na conta ${conta}. Restam ${qtd}.`") && html.includes("healsLow: `As curas estão acabando na conta ${conta}. Restam ${qtd} poções.`"), 'fala suprimento, conta e quantidade restante');
ok(html.includes('if (avisa) alertaCaptura(i, x);'), 'capturas novas passam pela seleção de IV e raridade');
ok(html.includes("const fieldShiny=fs?") && html.includes("if (r.fieldShiny)"), 'detecção precoce lê o shiny vivo no campo');
ok(html.includes('if (voiceQueue.length >= 8) voiceQueue.shift()') && html.includes("now - voiceLast.t < 5000"), 'fila e deduplicação impedem avalanche de voz');
ok(html.includes("nk==='strange pheromone'||nk==='strange pheromones'||nk==='boss token'||nk==='boss tokens'") && html.includes("alerta(i, 'msgRareDrop'") && html.includes("msgRareDrop: 'rareDrop'") && !html.includes('function beepRareDrop()'), 'Strange Pheromones e Boss Token disparam voz, sem toque sintetizado');
ok(html.includes('rareDrop: `A conta ${conta} encontrou ${poke}.`') && html.includes('rareDrop: `Account ${conta} found ${poke}.`') && html.includes('rareDrop: `La cuenta ${conta} encontró ${poke}.`'), 'voz de drop raro fala a conta e o item nos três idiomas');
ok(html.includes("['shiny', 'capture', 'rare', 'down', 'stalled', 'balls', 'faint']") && html.includes("alLocal_rare:") && html.includes('alLocal_capture:'), 'capturas especiais e drops raros têm opções individuais');

// Executa as funções reais, verificando mensagens, limites e entrega nos dois canais.
const filters = require('../src/domain/capture-filters');
const trecho = (start, end) => html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start)));
const state = { lang: 'pt', alertsOn: true, alLocal: { capture: true, shiny: true }, accounts: [{ name: 'Diego' }] };
const accountNames = new Function('accounts', 'defName',
  trecho('  const gameAccountNames =', '  // A calculadora de IV é um helper') + '; return { rememberAccountName, alertAccountName };')(
  state.accounts, i => 'Treinador ' + (i + 1));
state.alertAccountName = accountNames.alertAccountName;
const notifications = [], voices = [];
const phrase = new Function('state', 'captureFilters', 'vozLimpa', 'defName',
  'with(state) {' + trecho('  function fraseVoz(', '  function proximaFala(') + '; return fraseVoz; }')(
  state, filters, s => String(s || ''), () => 'Conta 1');
const alertCapture = new Function('state', 'captureFilters', 'window', 'fraseVoz', 'falaAlerta', 'kCa',
  'with(state) {' + trecho('  function alertaCaptura(', '  function mergeLogs(') + '; return alertaCaptura; }')(
  state, filters, { pokeAPI: { notify: (title, body) => notifications.push(body) } }, phrase,
  (type, i, meta) => voices.push(phrase(type, i, meta)), (i, x) => i + '_' + x.t + '_' + x.n);
function capture(x) { notifications.length = 0; voices.length = 0; alertCapture(0, { n: 'Pikachu', t: 1, ...x }); }
capture({ iv: 159, q: 1.5 });
ok(!voices.length && !notifications.length, 'IV 159 Épica não avisa');
capture({ iv: 160, q: 1.5 });
ok(voices.length === 1 && notifications.length === 1 && voices[0].includes('IV 160 e raridade Épica'), 'IV 160 avisa voz e Windows com IV e raridade');
capture({ iv: 161, q: 1.7 });
ok(voices.length === 1 && notifications.length === 1 && voices[0].includes('IV 161 e raridade Lendária'), 'IV alto e Lendária produzem apenas um aviso');
capture({ iv: 120, q: 1.7 });
ok(voices.length === 1 && voices[0].includes('IV 120 e raridade Lendária'), 'captura Lendária abaixo de 160 informa IV');
capture({ iv: 159, q: 2 });
ok(!voices.length && !notifications.length, 'Mítica abaixo de 160 não é anunciada como Lendária');
capture({ iv: 180, q: 4 });
ok(voices[0].includes('IV 180 e raridade Divina'), 'IV alto informa a raridade correta acima de Lendária');
capture({ iv: '160/192', q: 'Épica ×1,5' });
ok(voices[0].includes('IV 160 e raridade Épica'), 'formatos legados de IV e qualidade são aceitos');
capture({ iv: 180, q: 1.7, sh: true });
ok(!voices.length && !notifications.length, 'shiny não recebe um segundo aviso de captura especial');
ok(phrase('shinySuccess', 0, { name: 'Pikachu', iv: 180, quality: 1.5 }).includes('shiny Pikachu, com IV 180 e raridade Épica'), 'aviso único de shiny inclui IV alto e raridade');
ok(phrase('shinySuccess', 0, { name: 'Pikachu', iv: 120, quality: 1.7 }).includes('IV 120 e raridade Lendária'), 'shiny Lendária informa IV mesmo abaixo de 160');
ok(!phrase('shinyAppear', 0, {}) && !phrase('shinyFail', 0, {}), 'eventos de aparição e falha não geram frase');
state.alertsOn = false; capture({ iv: 180, q: 1.7 });
ok(!voices.length && !notifications.length, 'alertas desligados silenciam capturas especiais');
state.alertsOn = true; state.alLocal.capture = false; capture({ iv: 180, q: 1.7 });
ok(!voices.length && !notifications.length, 'preferência individual silencia capturas especiais');
state.lang = 'en';
ok(phrase('capture', 0, { name: 'Pikachu', iv: 160, quality: 1.7 }).includes('IV 160 and Legendary rarity'), 'mensagem em inglês informa IV e raridade');
state.lang = 'es';
ok(phrase('capture', 0, { name: 'Pikachu', iv: 160, quality: 1.7 }).includes('IV 160 y rareza Legendaria'), 'mensagem em espanhol informa IV e raridade');
state.lang = 'pt'; state.alLocal.capture = true;
const env = {
  ...state, captureFilters: filters, tabNames: ['Diego'], stName: () => 'Diego', ACOR: ['#ffffff'],
  mergedOnce: [], seenLog: {}, lifeShiny: [], lifeCatch: [], whCfg: {},
  kSh: (i, x) => 's' + i + '_' + x.t + '_' + x.n, kCa: (i, x) => 'c' + i + '_' + x.t + '_' + x.n,
  festaShiny() {}, captureShiny() {}, webhookSend() {}, lsSet() {},
  alertaCaptura: alertCapture, fraseVoz: phrase, alCat: () => 'shiny',
  defName: () => 'Diego', vozLimpa: s => String(s || ''), t: s => s,
  window: { pokeAPI: { notify: (title, body) => notifications.push(body) } },
  falaAlerta: (type, i, meta) => voices.push(phrase(type, i, meta))
};
const alert = new Function('env', 'with(env) {' + trecho('  function alerta(i,', '  // Alertas via coletor:') + '; return alerta; }')(env);
env.alerta = alert;
const merge = new Function('env', 'with(env) {' + trecho('  function mergeLogs(', '  // ----- Watchdog da hunt:') + '; return mergeLogs; }')(env);
const shinyCatch = { n: 'Pikachu', t: 5, sh: true, iv: 180, q: 1.5 };
notifications.length = 0; voices.length = 0;
merge(0, { catchLog: [{ ...shinyCatch, t: 1 }], shinyLog: [] });
ok(!voices.length && !notifications.length, 'histórico inicial é carregado sem avisos');
merge(0, { catchLog: [], shinyLog: [{ n: 'Pikachu', t: 2, def: true }] });
ok(!voices.length && !notifications.length, 'falha real no histórico de shiny permanece silenciosa');
merge(0, { catchLog: [shinyCatch], shinyLog: [{ n: 'Pikachu', t: 5, cap: true }] });
ok(voices.length === 1 && notifications.length === 1 && notifications[0].includes('IV 180 e raridade Épica'), 'merge de shiny capturado entrega um aviso completo por canal');
merge(0, { catchLog: [shinyCatch], shinyLog: [{ n: 'Pikachu', t: 5, cap: true }] });
ok(voices.length === 1 && notifications.length === 1, 'releitura da mesma captura não repete avisos');
alert(0, 'msgShiny', { name: 'Pikachu' });
ok(voices.length === 1 && notifications.length === 1, 'canal de notificação também rejeita aparição de shiny');

console.log('\n--- Calculadora de IV confiável e empacotada ---');
accountNames.rememberAccountName(0, 'Azuosd', 'personagem-a');
capture({ iv: 160, q: 1.5 });
ok(voices[0].includes('A conta Azuosd capturou') && notifications[0].includes('Azuosd'), 'voz e Windows usam o personagem lido em vez do apelido do painel');
ok(phrase('ballsLow', 0, { count: 5 }).includes('conta Azuosd'), 'suprimentos usam o mesmo nome real');
ok(phrase('rareDrop', 0, { name: 'Boss Token' }).includes('conta Azuosd'), 'drop raro usa o nome real');
accountNames.rememberAccountName(0, '', 'personagem-a');
ok(accountNames.alertAccountName(0) === 'Azuosd', 'reconexão sem nome mantém o último personagem');
accountNames.rememberAccountName(0, '', 'personagem-b');
ok(accountNames.alertAccountName(0) === 'Diego', 'troca de personagem não reutiliza o nome anterior');
accountNames.rememberAccountName(0, 'Azuosphp', 'personagem-b');
ok(accountNames.alertAccountName(0) === 'Azuosphp', 'nova leitura atualiza o nome');
state.accounts[0].email = 'outra-conta';
ok(accountNames.alertAccountName(0) === 'Diego', 'troca de conta configurada invalida nome em cache');
state.accounts[0].name = '';
ok(accountNames.alertAccountName(0) === 'Treinador 1', 'sem nome real nem apelido ainda há identificação do painel');
state.accounts.push({ name: 'Treinador 2' });
accountNames.rememberAccountName(1, 'Azuosjava', 'personagem-c');
ok(phrase('shinySuccess', 1, { name: 'Pikachu' }).includes('conta Azuosjava'), 'contas mantêm nomes independentes');
ok(main.includes("ipcMain.handle('iv-helper:read'") && main.includes("path.join(__dirname, 'presets', 'justpokedex.js')"), 'IPC lê somente o helper fixo de IV');
ok(preload.includes("readIvHelper: () => ipcRenderer.invoke('iv-helper:read')"), 'preload expõe apenas a leitura sem caminho ou URL');
ok(html.includes('async function injectIvHelper(wv)') && html.includes('injectIvHelper(wv); // somente o helper de IV auditado e empacotado'), 'helper volta a ser injetado nas páginas do jogo');
ok(html.includes("if (ivHelperBloqueado(url))") && html.includes("'/login', '/register', '/forgot-password', '/verify-email'"), 'helper nunca entra nas telas com credenciais');
ok(pkg.build.files.includes('presets/justpokedex.js'), 'instalador inclui o helper que a calculadora precisa');
ok(ivHelper.includes('window.__pgIv = {') && ivHelper.includes('async calc(entrada)'), 'helper contém a ponte de cálculo esperada');

console.log(`\nVoz e IV: ${checks} checks passaram`);
