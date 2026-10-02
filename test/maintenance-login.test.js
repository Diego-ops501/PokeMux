const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('  const MAINTENANCE_RETRY_MS =');
const end = html.indexOf('  // ----- Watchdog da hunt:', start);
assert(start >= 0 && end > start);
const source = html.slice(start, end);
const LOGIN = 'https://poke.idleworld.online/login';
const PLAY = 'https://poke.idleworld.online/play';

function setup() {
  let now = 1_000_000;
  const accounts = Array.from({ length: 4 }, (_, i) => ({ email: 'conta' + i, senha: 'teste' }));
  const off = [], deadT = [], huntRecovery = [], stallSlug = [], stallCid = [], stallOn = [], logs = [];
  const webviews = accounts.map(() => ({
    url: LOGIN, text: 'Servidores em manutenção. Tente novamente mais tarde.', reads: [], reloads: 0,
    getURL() { return this.url; },
    executeJavaScript(code) {
      this.reads.push(code);
      if (code === 'ALERTS') return Promise.resolve(null);
      return Promise.resolve(new Function('document', 'location', 'URL', 'return ' + code)(
        { body: { innerText: this.text }, activeElement: this.focused,
          querySelector: selector => selector.includes('one-time-code') ? this.otp : this.token }, { href: this.url }, URL));
    },
    reloadIgnoringCache() { this.reloads++; }
  }));
  const recoveryStart = html.indexOf('  function checkHuntRecovery(');
  const recoveryEnd = html.indexOf('  function checkStall(', recoveryStart);
  const api = new Function('accounts', 'off', 'webviews', 'deadT', 'huntRecovery', 'stallSlug', 'stallOn', 'Date', 'window', 'VOLTA_JS', 'stallCid',
    source + html.slice(recoveryStart, recoveryEnd) + '\nreturn { checkMaintenanceLogin, checkHuntRecovery, maintenanceLogin, maintenancePending, READ_MAINTENANCE };')(
    accounts, off, webviews, deadT, huntRecovery, stallSlug, stallOn, { now: () => now },
    { pokeAPI: { logError: (...args) => logs.push(args) } }, slug => 'RETURN_HUNT:' + slug, stallCid);
  return { ...api, accounts, off, webviews, deadT, huntRecovery, stallSlug, logs,
    advance(ms) { now += ms; }, get now() { return now; },
    check(i = 0) { return api.checkMaintenanceLogin(i, webviews[i]); } };
}

async function run() {
  {
    const s = setup(), w = s.webviews[0];
    await s.check();
    s.advance(299_999); await s.check();
    assert.equal(w.reloads, 0, 'não recarrega antes de cinco minutos');
    s.advance(1); await s.check();
    assert.equal(w.reloads, 1);
    for (let n = 0; n < 36; n++) { s.advance(300_000); await s.check(); }
    assert.equal(w.reloads, 37, 'continua tentando em uma manutenção de três horas');
    assert.equal(s.logs.length, 37);
    assert.equal(s.deadT[0], 0);
    w.text = 'E-mail Senha Entrar Confirme que é humano';
    await s.check(); s.advance(600_000); await s.check();
    assert.equal(w.reloads, 37, 'fim da manutenção interrompe as recargas');
    assert(s.maintenanceLogin[0], 'desafio manual pausa o intervalo');
    w.url = PLAY;
    assert.equal(await s.check(), false, 'jogo volta ao monitor normal');
  }
  {
    for (const text of ['Server is under maintenance', 'Servidor en mantenimiento', 'Servidores em MANUTENÇÃO']) {
      const s = setup(); s.webviews[0].text = text;
      await s.check(); s.advance(300_000); await s.check();
      assert.equal(s.webviews[0].reloads, 1, text);
    }
    const s = setup(); s.webviews[0].text = ''; s.webviews[0].url = LOGIN + '?maintenance=1';
    await s.check(); s.advance(300_000); await s.check();
    assert.equal(s.webviews[0].reloads, 1, 'também detecta o parâmetro de manutenção');
  }
  {
    for (const text of ['Confirme que é humano', 'Código de autenticação 2FA']) {
      const s = setup(); s.webviews[0].text = text;
      await s.check(); s.advance(3_600_000); await s.check();
      assert.equal(s.webviews[0].reloads, 0, text);
    }
    for (const url of [PLAY, LOGIN + '-fake', 'https://poke.idleworld.online.evil.com/login',
      'https://poke.idleworld.online/verify-email', 'about:blank']) {
      const s = setup(); s.webviews[0].url = url;
      assert.equal(await s.check(), false);
      assert.equal(s.webviews[0].reads.length, 0, url);
    }
    const s = setup(); await s.check(); s.advance(300_000); s.off[0] = true; await s.check();
    assert.equal(s.webviews[0].reloads, 0, 'conta desligada não recarrega');
    s.off[0] = false; s.accounts[0].senha = ''; await s.check();
    assert.equal(s.webviews[0].reads.length, 1, 'sem credenciais não inicia tentativas');
  }
  {
    const s = setup();
    await s.check(0); s.advance(150_000); await s.check(1); s.advance(150_000);
    await s.check(0); await s.check(1);
    assert.equal(s.webviews[0].reloads, 1);
    assert.equal(s.webviews[1].reloads, 0, 'intervalo independente por conta');
    const w = s.webviews[0];
    w.text = 'Entrar'; await s.check(); w.text = 'Manutenção'; await s.check();
    assert.equal(w.reloads, 1, 'uma nova manutenção começa com um novo intervalo');
  }
  {
    const s = setup();
    s.huntRecovery[0] = { slug: 'nightmare_beedrill', t: s.now };
    for (let n = 0; n < 180; n++) { s.advance(60_000); await s.check(); }
    assert.equal(s.huntRecovery[0].t, s.now, 'retorno à hunt continua válido após três horas');
    assert.equal(s.huntRecovery[0].slug, 'nightmare_beedrill');
    s.webviews[0].text = 'Entrar'; s.advance(60_000); await s.check();
    assert.equal(s.huntRecovery[0].t, s.now, 'login sem aviso também mantém o retorno pendente');
    s.huntRecovery[0] = { slug: 'antiga', t: s.now - 900_001 };
    s.webviews[0].text = 'Manutenção'; await s.check();
    assert.equal(s.huntRecovery[0].t, s.now - 900_001, 'retorno já vencido não é ressuscitado');
  }
  {
    const s = setup(), w = s.webviews[0];
    await s.check(); s.advance(300_000);
    let resolve;
    w.executeJavaScript = () => new Promise(done => { resolve = done; });
    const pending = s.check(); await s.check();
    w.url = PLAY; resolve(true); await pending;
    assert.equal(w.reloads, 0, 'resposta antiga não recarrega quem já entrou no jogo');
    assert.equal(s.maintenancePending[0], false);
    w.url = LOGIN; w.executeJavaScript = () => Promise.reject(new Error('navigating'));
    await s.check(); assert.equal(s.maintenancePending[0], false, 'falha libera a próxima leitura');
  }
  {
    // Exercita o intervalo real: no login não há __poke e READ_ALERTS devolveria null.
    const s = setup(), pendA = [];
    const marker = /  setInterval\(\(\) => \{\r?\n    webviews\.forEach\(\(w, i\) => \{/;
    const intervalStart = html.search(marker);
    const intervalEnd = html.indexOf('  // ----- Idioma: aplica', intervalStart);
    assert(intervalStart >= 0 && intervalEnd > intervalStart);
    let tick;
    new Function('setInterval', 'webviews', 'off', 'pendA', 'checkMaintenanceLogin', 'READ_ALERTS', 'checkHuntRecovery',
      html.slice(intervalStart, intervalEnd))(
      fn => { tick = fn; }, s.webviews, s.off, pendA, s.checkMaintenanceLogin, 'ALERTS', s.checkHuntRecovery);
    const flush = async () => { tick(); await new Promise(done => setImmediate(done)); };
    await flush(); s.advance(300_000); await flush(); s.advance(300_000); await flush();
    assert(s.webviews.every(w => w.reloads === 2), 'monitor real repete tentativas nas quatro contas');
    assert(s.webviews.every(w => !w.reads.includes('ALERTS')), 'não depende do coletor no login');
    s.webviews[0].url = PLAY; await flush();
    assert(s.webviews[0].reads.includes('ALERTS'), 'após login volta à coleta normal');
  }
  {
    const s = setup(), w = s.webviews[0];
    w.text = 'E-mail Senha Entrar';
    s.stallSlug[0] = 'nightmare_beedrill';
    await s.check();
    for (let n = 0; n < 36; n++) { s.advance(300_000); await s.check(); }
    assert.equal(w.reloads, 36, 'login sem aviso de manutenção tenta durante três horas');
    assert.equal(s.huntRecovery[0].slug, 'nightmare_beedrill', 'guarda a hunt anterior ao deslogar');
    w.url = PLAY;
    for (let n = 0; n < 5; n++) {
      s.advance(300_000);
      assert(s.checkHuntRecovery(0, { live: true, hunting: false, slug: 'cerulean' }, w));
    }
    assert(w.reads.some(code => code === 'delete window.__pgVolta;RETURN_HUNT:nightmare_beedrill'),
      'conta presa na cidade é enviada à hunt anterior repetidamente');
    assert.equal(w.reloads, 36, 'na cidade tenta entrar na hunt sem recarregar o painel');
    s.advance(300_000); s.checkHuntRecovery(0, null, w);
    assert.equal(w.reloads, 37, 'jogo sem coletor durante recuperação também recarrega');
    const rec = s.huntRecovery[0];
    s.checkHuntRecovery(0, { live: true, hunting: true, slug: rec.slug, lastKillT: rec.started }, w);
    assert(s.huntRecovery[0], 'field-init sem abate não encerra a recuperação');
    s.checkHuntRecovery(0, { live: true, hunting: true, slug: rec.slug, lastKillT: s.now }, w);
    assert.equal(s.huntRecovery[0], undefined, 'novo kill encerra a recuperação');
    s.advance(300_000); s.checkHuntRecovery(0, { live: true, hunting: false, slug: 'cerulean' }, w);
    assert.equal(w.reloads, 37, 'cidade voluntária sem recuperação não é recarregada');
  }
  {
    for (const manual of ['token', 'otp', 'focused']) {
      const s = setup(), w = s.webviews[0]; w.text = 'Entrar';
      w[manual] = manual === 'focused' ? { tagName: 'INPUT' } : { value: '' };
      await s.check(); s.advance(300_000); await s.check();
      assert.equal(w.reloads, 0, manual + ' pausa recarga');
      w[manual] = null; await s.check(); s.advance(300_000); await s.check();
      assert.equal(w.reloads, 1, manual + ' liberado permite próxima tentativa');
    }
  }
  {
    const s = setup(), w = s.webviews[0]; w.url = PLAY;
    s.huntRecovery[0] = { slug: 'nightmare_beedrill', cid: 'A', t: s.now, started: s.now - 600_000, lastRetry: s.now - 600_000 };
    s.stallSlug[0] = 'nightmare_beedrill';
    s.checkHuntRecovery(0, { live: true, cid: 'B', hunting: false }, w);
    assert.equal(s.huntRecovery[0], undefined, 'troca de personagem cancela a hunt anterior');
    assert.equal(w.reads.length, 0, 'não envia a conta nova à hunt da antiga');
    s.huntRecovery[0] = { slug: 'nightmare_beedrill', t: s.now, started: s.now, lastRetry: s.now - 600_000 };
    s.off[0] = true; s.checkHuntRecovery(0, null, w);
    assert.equal(w.reloads, 0, 'resposta atrasada não recarrega conta desligada');
  }
  console.log('OK   recuperação: login sem manutenção, tentativas contínuas, cidade, novos abates e CAPTCHA/2FA');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
