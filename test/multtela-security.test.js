const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const main = read('main.js');
const preload = read('preload.js');
const html = read('index.html');
const pkg = JSON.parse(read('package.json'));
const update = read('src/main/update-manager.js');
let failed = false;
const ok = (condition, label) => { console.log((condition ? 'OK  ' : 'FAIL') + ' ' + label); if (!condition) failed = true; };

console.log('\n--- PokeMux: limites e segurança ---');
ok(main.includes('const MAX_ACCOUNTS = 4;') && main.includes('.slice(0, MAX_ACCOUNTS)'), 'cofre limita os dados a quatro contas');
ok(html.includes('Math.min(4, Math.max(1, +lsGet(\'count\') || 4))'), 'renderer limita a grade a quatro contas');
ok(!main.includes("JSON.parse(buf.toString('utf8'))"), 'credenciais não têm fallback em texto puro');
ok(main.includes('safeStorage.encryptString(json)') && main.includes("fs.renameSync(f + '.tmp', f)"), 'cofre usa criptografia e troca atômica');
ok(main.includes('contextIsolation: true') && main.includes('sandbox: true') && main.includes('nodeIntegration: false'), 'janelas locais usam isolamento, sandbox e sem Node');
ok(main.includes("origin !== GAME") && main.includes("target.getType() !== 'webview'"), 'screenshot só aceita webview do jogo');
ok(!main.includes("ipcMain.handle('userscript:fetch'") && !preload.includes('fetchUserScript'), 'não existe canal de userscript');

console.log('\n--- Compra, retorno e recursos locais ---');
ok(!main.includes('app.userAgentFallback ='), 'Turnstile recebe o User-Agent nativo e estável do Electron');
ok(html.includes('const podeModificarPagina = (wv) =>') && html.includes('const authPage = !podeModificarPagina(wv);'), 'rotas de autenticação ficam sem coletores e modificações do navegador');
ok(html.includes('if (authPage) {') && html.includes('wv.executeJavaScript(scrollLoginScript)') && html.includes('return;'), 'login só recebe enquadramento visual, sem automação do CAPTCHA');
ok(html.includes('const LOGIN_STAGGER_MS = 3000') && html.includes('criarPainel(i, i * LOGIN_STAGGER_MS)') && html.includes('LOGIN_URL, i * LOGIN_STAGGER_MS'), 'desafios Turnstile das quatro contas são iniciados em sequência, não em rajada');
ok(html.includes('const delayedLogin = +loginDelay > 0;') && html.includes("wv.src = delayedLogin ? 'about:blank' : START_URL;") && html.includes('if (delayedLogin) agendaLoginPage(wv, i, START_URL, loginDelay)'), 'primeiro WebView abre diretamente e somente os seguintes esperam sua vez');
ok(html.includes('try { wv.src = url; }') && !html.includes('Promise.resolve(wv.loadURL(url))'), 'agendamento usa src e funciona mesmo no primeiro instante de vida do WebView');
ok(html.includes("if ((wv.getURL() || '') === 'about:blank') return;"), 'painel de espera vazio não aparece falsamente como online');
ok(!html.includes("iframe[src*='challenges.cloudflare.com']") && !html.includes('turnstile.render('), 'PokeMux não clica, reinicializa nem reconfigura o widget do site');
ok(html.includes("if (wv.__pgAuthPage) { wv.__pgAuthPage = false; wv.reload(); }"), 'coletor é instalado apenas depois que a SPA entra no jogo');
ok(!html.includes('/api/game/balls/buy'), 'Resumo não executa compras de Pokébolas');
ok(!html.includes('cfgBallSel') && !html.includes('cfgBallB1'), 'Resumo não oferece os controles de compra removidos');
ok(html.includes("let voltaHuntOn = lsGet('voltaHunt') === '1'"), 'retorno à hunt continua desligado por padrão');
ok(html.includes("lsSet('cleanHud', '0')") && html.includes("let cleanOn = lsGet('cleanHud') === '1'") && !html.includes("lsGet('cleanHud') !== '0'"), 'HUD do jogo fica visível por padrão e Limpar jogo permanece opcional');
ok(html.includes("https://poke.idleworld.online/?ref=2G9B4BV") && html.includes("LOGIN_URL + '?ref=2G9B4BV'") && !html.includes('CJNKGPB'), 'referral oficial usa a chave 2G9B4BV');
ok(html.includes("window.open('https://link.mercadopago.com.br/POKEmux')") && !html.includes('link.mercadopago.com.br/pokegrid'), 'Ajude o projeto usa o link oficial do PokeMux');
ok(html.includes("n>=3") && html.includes("},12000)"), 'retorno mantém três tentativas espaçadas');
ok(main.includes("ipcMain.handle('overlay:toggle'") && html.includes('id="overlayBtn"'), 'overlay somente-leitura disponível');
ok(main.includes("ipcMain.handle('shiny:capture'") && html.includes("let shotShinyOn = lsGet('shotShiny') === '1'"), 'print de shiny é opcional e local');

console.log('\n--- Instalador e atualização ---');
ok(pkg.name === 'pokemux' && pkg.build.productName === 'PokeMux' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:\.[0-9A-Za-z]+)*)?$/.test(pkg.version), 'produto PokeMux tem versão válida para publicação');
ok(!html.includes('id="appSidebar"') && !html.includes('--pg-sidebar') && html.includes('id="statsBtn"') && html.includes('id="cardsBtn"'), 'layout clássico remove a sidebar fixa e restaura os controles no topo');
ok(html.includes('class="cd-catches-list"') && html.includes('.cd-catches-list { max-height: clamp(') && html.includes('overflow-y: auto'), 'últimas capturas têm altura responsiva e rolagem interna');
ok(html.includes('captureFilters.filterCaptures(lifeCatch, f)') && !html.includes('.slice(-40)'), 'últimas capturas mostram todos os resultados que passam pelos filtros');
ok(html.includes("delete cardsCfg.h.catches") && html.includes("sec === 'catches' ? ''"), 'últimas capturas ignora altura manual antiga e não oferece redimensionamento vertical');
ok(html.includes("it.dataset.s === 'catches' ? it.querySelector('.cd-catches-list')") && html.includes('scrollBox.scrollTop = rolagem[it.dataset.s]'), 'rolagem das últimas capturas não volta ao topo durante a atualização automática');
ok(html.includes('id="cdFcR"') && html.includes('captureFilters.filterCaptures(lifeCatch, f)') && html.includes("['legendary', 'Lendária', 'Legendary'"), 'últimas capturas filtram pela faixa exata de raridade');
ok(pkg.build && pkg.build.win && pkg.build.nsis && pkg.build.nsis.deleteAppDataOnUninstall === false, 'instalador NSIS preserva dados');
ok(pkg.dependencies['electron-updater'] && pkg.devDependencies['electron-builder'], 'dependências de build e update declaradas');
ok(update.includes('autoDownload = false') && update.includes('autoInstallOnAppQuit = false'), 'atualização nunca baixa ou instala silenciosamente');
ok(update.includes("feed.protocol !== 'https:'") && update.includes("feed.hostname !== 'github.com'"), 'feed de atualização tem lista de origem restrita');
ok(update.includes('/Diego-ops501\\/PokeMux\\/releases'), 'atualizador usa o repositório público PokeMux');
ok(update.includes("ipcMain.handle('update:download'") && update.includes("ipcMain.handle('update:install'"), 'download e instalação exigem ações separadas');
ok(update.includes('24 * 60 * 60 * 1000') && update.includes('checkAutomatic'), 'checagem automática é limitada a uma vez por dia');

if (failed) { console.error('\nFALHOU'); process.exit(1); }
console.log('\nTODOS PASSARAM');
