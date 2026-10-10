// Real Electron boot of the full app, with isolated sessions and no game network access.
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
app.setPath('userData', path.join(os.tmpdir(), 'pokemux-workspace-' + process.pid));
app.on('web-contents-created', (_event, contents) => {
  contents.session.webRequest.onBeforeRequest({ urls: ['https://*/*', 'http://*/*'] }, (_details, callback) => callback({ cancel: true }));
  contents.on('will-attach-webview', (_event, _preferences, parameters) => { parameters.src = 'about:blank'; });
});
const preload = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
for (const channel of new Set([...preload.matchAll(/ipcRenderer.invoke\('([^']+)'/g)].map(match => match[1]))) {
  ipcMain.handle(channel, () => channel === 'creds:load' ? ['Aurora', 'Boreal', 'Citrino', 'Dourado'].map((name, i) => ({ name, email: 'fixture-' + i, senha: '' })) : false);
}
ipcMain.on('app:version', event => { event.returnValue = require('../package.json').version; });
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1440, height: 950, show: false, useContentSize: true,
    webPreferences: { preload: path.join(root, 'preload.js'), webviewTag: true, contextIsolation: true, sandbox: true, backgroundThrottling: false } });
  try {
    await win.loadFile(path.join(root, 'index.html'));
    const result = await win.webContents.executeJavaScript(`(async () => {
      const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
      const check = (value, message) => { if (!value) throw Error(message); };
      for (let attempt = 0; attempt < 40 && !workspaceUI; attempt++) await pause(50);
      check(workspaceUI && webviews.length === 4, 'full app boots with four sessions');
      await pause(80);
      const q = selector => document.querySelector(selector);
      check(q('#workspaceAccounts').textContent.includes('Aurora'), 'saved account names appear before game data');
      check(!q('#workspaceAccounts').textContent.includes('Treinador'), 'no generic trainer labels in top navigation');
      check(!q('#workspaceAccounts').textContent.includes('fixture-'), 'emails are not shown as account names');
      const sessions = webviews.slice(), nodes = [...grid.children];
      const names = ['Nome do jogo', '<img src=x onerror=alert(1)>', 'Terceira conta', 'Quarta conta'];
      const states = names.map((name, i) => ({ ok: true, live: true, cid: 'fixture-character-' + i, name,
        level: 300, gold: 1500000, diamonds: 20, balls: 500, potions: 100, revives: 5,
        hunt: 'Furious Scyther', a: { seconds: 300, xph: 4500000, gph: 292000, kph: 172, captures: i + 1, shinyFound: 0, shinyCap: 0 },
        team: [], bag: [], drops: [], events: [], catchLog: [], shinyLog: [], usedList: [], invMap: {}, ballMap: {} }));
      let reads = 0;
      webviews.forEach((view, i) => {
        view.getURL = () => 'https://poke.idleworld.online/play';
        view.executeJavaScript = async script => { if (script === READ_STATE) reads++; return states[i]; };
        rememberAccountName(i, states[i].name, states[i].cid);
        stCache[i] = { t: Date.now(), d: states[i], slot: stateSlot(i) };
      });
      workspaceUI.refresh(); await pause(80);
      check(q('#workspaceAccounts [data-account="0"] .account-label').textContent === names[0], 'actual character name replaces saved alias');
      check(!q('#workspaceAccounts img'), 'account names are inserted as text, never HTML');
      check(q('.panel-metrics').textContent.includes('4,5'), 'metrics use existing account state');
      const firstChip = q('#workspaceAccounts [data-account="0"]');
      workspaceUI.refresh(); await pause(50);
      check(q('#workspaceAccounts [data-account="0"]') === firstChip, 'passive updates preserve navigation DOM');
      check(reads === 0, 'workspace rendering makes no extra state queries');
      firstChip.click(); await pause(80);
      check(document.body.dataset.workspaceMode === 'focus' && grid.children[0].classList.contains('expanded'), 'account button opens focus mode');
      check(q('#focusAccounts [data-account="0"]').hidden, 'focused account is omitted from other-account shortcuts');
      q('#focusAccounts [data-account="2"]').click(); await pause(80);
      check(grid.children[2].classList.contains('expanded'), 'other-account shortcut switches exact session');
      q('[data-mode="grid"]').click(); await pause(80);
      check(document.body.dataset.workspaceMode === 'grid' && !grid.querySelector('.expanded'), 'grid restores all game panels');
      states.forEach((d,i)=>{d.farm={hunting:true,lastCombatT:Date.now()};d.hasBalls=true;d.hasInv=true;d.ballMap={1:500};d.team=[{name:'Rhydon',sid:112,level:300,ivt:175,q:1.8,ld:true,hp:100,hm:100}];d.a.ballsUsed=100;d.a.potsUsed=10;d.a.seconds=1200;});
      q('[data-mode="summary"]').click(); await pause(120);
      check(q('.summary-account') && document.querySelectorAll('.summary-account').length===4,'summary shows four account cards');
      check(q('.summary-account').textContent.includes('Rhydon') && q('.summary-account img'),'active Pokemon sprite and stats shown');
      const accountNode=q('[data-summary-key="account:0"]'),field=q('#cdFcN');
      const beforeSessionNodes=webviews.slice();states[0].a.gph=123456;
      await refreshCards(true);
      check(q('[data-summary-key="account:0"]')===accountNode && q('#cdFcN')===field,'passive summary update preserves cards and filter DOM');
      check(accountNode.textContent.includes('123'),'updated rate appears on same card');
      field.focus();field.value='typing';states[0].a.gph=234567;await refreshCards();
      check(document.activeElement===field && field.value==='typing' && accountNode.textContent.includes('235'),'live numbers update without disturbing typed filter: '+JSON.stringify({same:document.activeElement===field,value:field.value,text:accountNode.textContent}));field.blur();field.value='';
      const originalCatch=lifeCatch;
      lifeCatch=[{p:0,acc:'Conta A',n:'Captura simples',iv:80,q:1,t:Date.now(),dot:'#fff'},{p:1,acc:'Conta B',n:'IV alto',iv:180,q:1,t:Date.now()-1000,dot:'#fff'},{p:2,acc:'Conta C',n:'Shiny',sh:true,iv:80,q:1,t:Date.now()-2000,dot:'#fff'}];
      await refreshCards(true);
      check(q('.cd-catches-list').textContent.includes('IV alto') && !q('.cd-catches-list').textContent.includes('Captura simples'),'important captures default hides common captures '+JSON.stringify({filter:cdFC,text:q('.cd-catches-list').textContent,entries:lifeCatch}));
      q('#cdFcMode').value='all';q('#cdFcMode').dispatchEvent(new Event('change'));await pause(60);
      check(q('.cd-catches-list').textContent.includes('Captura simples') && q('.cd-catches-list .cd-row').textContent.includes('Shiny'),'all captures includes common and prioritizes shiny');
      states[0].farm.hunting=false;states[1].live=false;await refreshCards(true);
      check(q('[data-summary-key="account:0"]')===accountNode,'showing account warnings preserves existing cards');
      check(q('.summary-attention').textContent.includes('Fora da hunt') && q('.summary-attention').textContent.includes('Desconectada'),'idle and disconnected account problems highlighted');
      check(!q('[data-summary-key="account:1"]').textContent.includes('Rhydon'),'disconnected account does not show stale Pokemon');
      states[0].farm.hunting=true;states[1].live=true;
      lifeCatch=Array.from({length:40},(_,i)=>({p:0,acc:'Conta A',n:'Rhydon '+i,iv:180,q:1.8,t:Date.now()-i*1000,dot:'#fff'}));await refreshCards(true);
      const catchesBox=q('.cd-catches-list'),firstCapture=catchesBox.querySelector('.cd-row');catchesBox.scrollTop=180;const scrollBefore=catchesBox.scrollTop;
      states[0].a.gph+=100;await refreshCards(true);
      check(catchesBox===q('.cd-catches-list') && firstCapture===catchesBox.querySelector('.cd-row') && catchesBox.scrollTop===scrollBefore,'capture identities and scrolling preserved during live update');
      lifeCatch=originalCatch;cdFC.mode='important';await refreshCards(true);
      check(webviews.every((view,i)=>view===beforeSessionNodes[i]),'summary updates preserve native game sessions');
      const originalRecommend=openHuntRecommendations, recommendations=[];
      openHuntRecommendations=i=>recommendations.push(i);
      q('[data-summary-recommend="2"]').click();
      check(recommendations.join(',')==='2' && cardsOn,'summary recommendation uses the selected account without changing mode');
      check(q('[data-summary-recommend="2"]').textContent==='Recomendar hunt','summary button has the correct label');
      openHuntRecommendations=originalRecommend;
      q('[data-summary-key="account:2"] .summary-actions [data-summary-open]').click();await pause(80);
      check(!cardsOn && grid.children[2].classList.contains('expanded') && statsOpen && statsIdx===2,'Open account also opens that account analysis');
      statsAutoPend=true;
      cardsOn=true;applyCards();await pause(80);
      check(!statsOpen && !statsAutoPend && !statsEl.classList.contains('show') && !document.body.classList.contains('stats-open'),'entering summary closes analysis and cancels pending automatic opening');
      await refreshCards(true);
      check(!statsOpen,'passive summary updates keep analysis closed');
      q('#statsBtn').click();await pause(80);
      check(cardsOn && statsOpen && statsEl.classList.contains('show'),'explicit analysis button can open analysis in summary');
      applyCards();await pause(80);
      check(statsOpen,'reapplying summary mode preserves explicitly opened analysis');
      q('#stats .st-x').click();

      check(cardsOn && document.body.dataset.workspaceMode === 'summary', 'summary uses existing lightweight dashboard');
      q('#workspaceAccounts [data-account="1"]').click(); await pause(80);
      check(!cardsOn && grid.children[1].classList.contains('expanded'), 'account button exits summary and restores game');
      check(!statsOpen,'leaving summary does not automatically reopen analysis');
      check(webviews.every((view, i) => view === sessions[i]) && [...grid.children].every((node, i) => node === nodes[i]), 'switching modes never recreates game sessions');
      q('.expanded .panel-analyze').click(); await pause(80);
      check(statsOpen && statsIdx === 1 && document.body.classList.contains('stats-open'), 'analysis opens for exact focused account');
      const dock = q('#stats').getBoundingClientRect(), game = grid.getBoundingClientRect();
      check(dock.left >= game.right - 2 && dock.right <= innerWidth, 'analysis is docked on right without covering game');
      const openCalls = [], original = marketUI.open;
      marketUI.open = tab => { openCalls.push(tab); };
      const inventoryOriginal = inventoryUI.open; let inventoryOpened = false;
      inventoryUI.open = () => { inventoryOpened = true; };
      q('#inventoryBtn').click(); check(!q('#marketAlertsBtn'), 'market alerts shortcut removed from topbar');
      check(inventoryOpened && openCalls.length === 0, 'inventory opens independently of market');
      inventoryUI.open = inventoryOriginal;
      marketUI.open = original;
      q('#menuBtn').click(); await pause(100);
      check(q('#menu').open, 'settings opens a native modal');
      const settingsRect=q('#menu').getBoundingClientRect();
      check(Math.abs(settingsRect.left+settingsRect.right-innerWidth)<2 && Math.abs(settingsRect.top+settingsRect.bottom-innerHeight)<2,'settings centered independently of stats dock');
      check(!q('#menu #cardsBtn') && !q('#menu #layout'), 'duplicate toolbar modes absent from settings');
      check(q('#menu #accounts') && q('#menu #eco') && q('#menu #bkExp'), 'existing account, performance and backup controls preserved');
      q('.settings-nav [data-section="notifications"]').click();
      const capture=q('[data-notification="capture"]'); const oldCapture=alLocal.capture;
      capture.click();check(alLocal.capture===!oldCapture && JSON.parse(localStorage.getItem('alLocal')).capture===!oldCapture,'notification changes persist');capture.click();
      q('.settings-search').value='desempenho';q('.settings-search').dispatchEvent(new Event('input'));
      check(!q('.settings-section[data-section="performance"]').hidden && q('.settings-section[data-section="accounts"]').hidden,'settings search selects matching categories');
      q('#menu header button').click();await pause(30);check(!q('#menu').open,'settings closes cleanly');
      q('#stats .st-gear').click();await pause(100);
      check(q('#menu').open && !q('.settings-section[data-section="analysis"]').hidden && q('#menu .st-cfg input'),'analysis gear opens centralized editor');
      q('#menu header button').click();await pause(30);
      settingsUI.open('summary');await pause(50);
      const beforeOrder=cardsCfg.order.slice();const rows=q('.settings-section[data-section="summary"]');
      rows.querySelector('.settings-summary-row button:last-child').click();
      check(cardsCfg.order[1]===beforeOrder[0],'central summary editor reorders persisted sections');
      cardsCfg.order=beforeOrder;saveCardsCfg();
      q('#menu').dispatchEvent(new Event('cancel',{cancelable:true}));await pause(30);check(!q('#menu').open,'Escape cancel closes settings');
      const execute = webviews.map(view => view.executeJavaScript);
      webviews.forEach((view,i)=>view.executeJavaScript=async script => script.includes('async function readIvInGame') ? {erro:'missingConditions',nome:'Rhydon'} : script.includes('const complete = await new Promise') ? {ok:true,complete:true,cid:states[i].cid,rows:[{kind:'pokemon',id:'owned',name:'Rhydon',speciesId:112,level:400,quality:1.8,iv:175,ivTotal:175,quantity:1,stats:{}}]} : execute[i](script));
      const previousIv=ivAtivo;ivAtivo=true;inventoryUI.open();await pause(90);
      const inventoryRect=q('#inventoryDialog').getBoundingClientRect();
      check(Math.abs(inventoryRect.left+inventoryRect.right-innerWidth)<2 && Math.abs(inventoryRect.top+inventoryRect.bottom-innerHeight)<2,'inventory centered in full app despite global CSS reset and analysis dock');
      check(q('#inventoryDialog').contains(ivEl),'real shared IV card is moved into modal');
      q('#inventoryDialog .inventory-row').click();await pause(80);
      check(ivEl.classList.contains('show') && ivEl.textContent.includes('Rhydon'),'real IV renderer displays in inventory modal');
      const cardRect=ivEl.getBoundingClientRect();check(cardRect.width>0 && cardRect.left>=0 && cardRect.right<=innerWidth,'IV popup remains within viewport');
      inventoryUI.close();check(ivEl.parentNode===document.body && !ivEl.classList.contains('show'),'shared IV popup restored after closing inventory');
      ivAtivo=previousIv;webviews.forEach((view,i)=>view.executeJavaScript=execute[i]);
      statsOpen = false; applyStats(); q('[data-mode="grid"]').click(); await pause(60);
      off[0] = true; workspaceUI.refresh(); await pause(60);
      check(q('#workspaceAccounts [data-account="0"]').textContent.includes('Desligada') && grid.children[0].querySelector('.panel-metrics b').textContent === '—', 'offline account hides stale hunt metrics');
      off[0] = false;
      names[0] = 'Novo personagem'; states[0].name = names[0]; states[0].cid = 'changed-character';
      const push = new Event('console-message'); Object.defineProperty(push, 'message', { value: '__PGST__' + JSON.stringify(states[0]) });
      webviews[0].dispatchEvent(push); await pause(60);
      check(q('#workspaceAccounts [data-account="0"] .account-label').textContent === names[0], 'game state push refreshes actual character name');
      setCount(2); await pause(60);
      check(q('#workspaceAccounts').children.length === 2 && webviews[0] === sessions[0] && webviews[1] === sessions[1], 'reducing account count preserves remaining sessions');
      lang = 'en'; applyLang(); await pause(60);
      check(q('[data-mode="summary"]').textContent.includes('Summary'), 'new navigation supports language changes');
      lang = 'pt'; applyLang(); await pause(60);
      return 'Workspace completo: nomes reais, sessões preservadas, Grade/Foco/Resumo, análise, atalhos, isolamento e idiomas aprovados.';
    })()`);
    console.log(result);
    await win.webContents.executeJavaScript('setCount(4); workspaceUI.refresh()');
    for (const width of [1440, 1100, 800]) {
      win.setContentSize(width, 850);
      await new Promise(resolve => setTimeout(resolve, 120));
      const layoutError = await win.webContents.executeJavaScript(`(() => { try {
        ajustaProporcao();
        const bar = document.querySelector('#topbar'), rect = document.querySelector('#toolbarIcons').getBoundingClientRect();
        if (rect.right > innerWidth + 1 || bar.scrollWidth > innerWidth + 1) throw Error('Toolbar overflow at ' + innerWidth);
        const viewport = document.querySelector('webview').getBoundingClientRect(), panel = document.querySelector('.panel').getBoundingClientRect(), strip = document.querySelector('.panel-metrics').getBoundingClientRect();
        if (viewport.bottom > strip.top + 1 || viewport.right > panel.right + 1) throw Error('Game viewport overlaps metrics');
        return '';
      } catch (error) { return error.message; } })()`);
      if (layoutError) throw Error(layoutError);
      await win.webContents.executeJavaScript("settingsUI.open('performance')");
      await new Promise(resolve=>setTimeout(resolve,80));
      const settingsError=await win.webContents.executeJavaScript(`(()=>{const r=menu.getBoundingClientRect(),p=menu.querySelector('.settings-panel').getBoundingClientRect();return !menu.open||r.width<600||r.height<300||r.left<0||r.right>innerWidth||r.bottom>innerHeight||Math.abs(r.left+r.right-innerWidth)>2||p.right>r.right+1?'Settings overflow at '+innerWidth:''})()`);
      if(settingsError)throw Error(settingsError);
      if(width===1440 && process.env.POKEMUX_SETTINGS_PREVIEW) {win.showInactive();await new Promise(resolve=>setTimeout(resolve,400));fs.writeFileSync(process.env.POKEMUX_SETTINGS_PREVIEW,(await win.capturePage()).toPNG());win.hide();}
      await win.webContents.executeJavaScript('closeSettings()');
      await win.webContents.executeJavaScript(`(()=>{webviews.forEach((view,i)=>{const d={ok:true,live:true,cid:'preview-'+i,name:['Azuosjava','Azuosd','Azuospy','Azuosphp'][i],farm:{hunting:true,lastCombatT:Date.now()},hasBalls:true,hasInv:true,balls:1000,potions:300,ballMap:{1:1000},team:[{name:['Rhydon','Pinsir','Muk','Cloyster'][i],sid:[112,127,89,91][i],level:498,ivt:175,q:1.8,ld:true,hp:100,hm:100}],a:{seconds:3600,gph:3000000+i*800000,xph:12000000+i*1000000,kph:815,captures:37,ballsUsed:100,potsUsed:10},hunt:'Furious Scyther',usedList:[],invMap:{},catchLog:[]};rememberAccountName(i,d.name,d.cid);stCache[i]={t:Date.now(),d,slot:stateSlot(i)};view.executeJavaScript=async()=>d;});cardsOn=true;applyCards();})()`);
      await new Promise(resolve=>setTimeout(resolve,150));
      const summaryError=await win.webContents.executeJavaScript(`(()=>{const nodes=[...document.querySelectorAll('.summary-account')], tops=nodes.map(n=>n.getBoundingClientRect().top), box=document.querySelector('#cards');return nodes.length!==4||tops.some(t=>Math.abs(t-tops[0])>1)||box.scrollWidth>box.clientWidth+1?'Summary card layout failed at '+innerWidth:''})()`);
      if(summaryError)throw Error(summaryError);
      if(width===1440 && process.env.POKEMUX_SUMMARY_PREVIEW){win.showInactive();await new Promise(resolve=>setTimeout(resolve,400));fs.writeFileSync(process.env.POKEMUX_SUMMARY_PREVIEW,(await win.capturePage()).toPNG());win.hide();}
      await win.webContents.executeJavaScript('cardsOn=false;applyCards()');
      console.log('Layout aprovado: ' + width + ' px');
    }
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { win.destroy(); app.exit(process.exitCode || 0); }
});
