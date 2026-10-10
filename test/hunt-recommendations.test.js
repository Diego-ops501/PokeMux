'use strict';
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const engine = require('../src/domain/hunt-recommendations');
const math = require('../src/domain/iv-math');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8').replace(/\r\n/g, '\n');
const fixture = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'fixtures/jogo-2026-09-17.json.gz'))));
async function run() {
  const accounts = [{off:false,live:false},{off:false,live:true},{off:false,live:true},{off:true,live:false}];
  assert.equal(engine.selectAccount({accounts,preferred:0}),1,'conta na tela de login não toma a vez da conta conectada');
  assert.equal(engine.selectAccount({accounts,expanded:2,preferred:1}),2,'conta expandida tem prioridade');
  assert.equal(engine.selectAccount({accounts,focused:2,preferred:1}),2,'conta em foco tem prioridade');
  assert.equal(engine.selectAccount({accounts,requested:0,expanded:2}),0,'botão de uma conta respeita a escolha explícita');
  assert.equal(engine.selectAccount({accounts,expanded:3,preferred:2}),2,'conta desligada é ignorada');
  assert.equal(engine.selectAccount({accounts:[{off:true,live:false}]}),-1,'nenhuma conta ligada');
  const openingSource = html.slice(html.indexOf('  async function openHuntRecommendations('), html.indexOf('  async function refreshHuntRecommendations('));
  const hrAccount = {}, hrBody = {}, hrStatus = {}, hrState = {revision:0};
  let shown = false, refreshes = 0;
  const ui = {hrAccount,hrBody,hrStatus,hrState,hrEngine:engine,statsIdx:0,count:2,off:[false,false],
    grid:{children:[{classList:{contains:()=>false}},{classList:{contains:()=>false}}]},
    document:{activeElement:null,getElementById:()=>({})},hrEl:{classList:{add:()=>{shown=true},contains:()=>shown}},
    webviews:[{executeJavaScript:async()=>({ok:false})},{executeJavaScript:async()=>({ok:true,live:true,name:'Conta conectada'})}],
    podeModificarPagina:()=>true,READ_STATE:'state',t:x=>x,esc:x=>x,alertAccountName:i=>'Conta '+i,
    hrFocus:{options:[{},{}]},hrPotion:{options:[{},{}]},
    refreshHuntRecommendations:async()=>{refreshes++;}};
  ui.readAppState = i => ui.webviews[i].executeJavaScript('state');
  const open = new Function(...Object.keys(ui), openingSource+';return openHuntRecommendations;')(...Object.values(ui));
  await open();
  assert.equal(hrAccount.value,'1','botão global consulta a conexão das contas antes de escolher');
  assert(hrAccount.innerHTML.includes('Conta conectada'),'seletor usa o nome recebido do jogo');
  await open(0);
  assert.equal(hrAccount.value,'0','botão individual continua direcionado à própria conta');
  assert.equal(refreshes,2,'recomendação carrega após selecionar a conta correta');
  const template = html.slice(html.indexOf('  const HUNTS_JS =') + '  const HUNTS_JS ='.length).split(';\n')[0];
  // Avalia o template local da aplicação, com respostas exclusivamente da fixture.
  const huntSource = new Function('return ' + template)();
  const catalog = await new Function('fetch', 'return ' + huntSource)(async url => ({ json: async () =>
    url.includes('map-markers') ? { hunts: fixture.hunts } : { creatures: fixture.creatures } }));
  const source = html.slice(html.indexOf('  const CHART ='), html.indexOf('  // Ditto: para cada TIPO'));
  const { sugCalc, efTipo } = new Function('window', 'lsGet', 'basesByName', 'movesByName', source + ';return {sugCalc,efTipo};')(
    { PokeMuxIvMath: math }, () => null, catalog.bs, catalog.mv);
  const project = (sp, level, q, ivt) => {
    const b = catalog.bs[sp];
    if (!b) return null;
    return math.projectPokemon({ quality:q || 1, ivTotal:ivt || 96, species:{baseStats:{hp:b[0],atk:b[1],def:b[2],spa:b[3],spd:b[4],speed:b[5]}} }, level).stats;
  };
  const attacker = { sp:'charizard', level:100, q:1.79, ivt:147, tlv:120, t1:'FIRE', t2:'FLYING', tms:[] };
  const args = { attacker, hunts:catalog.h, offense:sugCalc, project, moves:sp => (catalog.mv[sp] || {}).a || [], effectiveness:efTipo };
  const rows = engine.rank(args);
  const lowArgs = {...args,attacker:{sp:'squirtle',level:1,q:0.943,ivt:110,tlv:1,t1:'WATER',t2:'',tms:[],stats:{hp:24,atk:1,def:1,spa:1,spd:1,speed:1}}};
  const lowRows = engine.rank(lowArgs);
  const geodude = lowRows.find(r=>r.hunt.sl==='geodude');
  assert(geodude,'Geodude Lv1 está disponível para o iniciante');
  assert.equal(geodude.attack.nome,'Water Gun');
  assert.equal(geodude.attack.eff,5.5,'vantagem Água contra Pedra e Terra é amplificada na hunt');
  assert.equal(lowRows[0].hunt.sl,'geodude','Geodude priorizado para Squirtle Lv1 com atributos do jogo');
  const readTemplate = html.slice(html.indexOf('  const READ_STATE =') + '  const READ_STATE ='.length,html.indexOf('  const statsEl ='));
  const readScript = new Function('return '+readTemplate)();
  const state = new Function('window','return '+readScript)({__poke:{ws:{pokes:{list:[{id:'p',team:true,leader:true,hp:24,maxHp:24,stats:{atk:1,def:1,spAtk:3,spDef:4,speed:1}}]}},api:{}}});
  assert.equal(state.team[0].stats.spa,3,'SpA usa stats.spAtk do jogo');
  assert.equal(state.team[0].stats.spd,4,'SpD usa stats.spDef do jogo');
  assert.equal(lowRows.find(r=>r.hunt.sl==='togepi').risk,'low','catálogo sem golpes ofensivos aprendidos não vira risco desconhecido');
  const until = Date.now()+60000;
  const event = {key:'type-of-day',name:'🐛 Tipo do Dia: Inseto',desc:'+20% de XP e +20% de loot em Pokémon do tipo Inseto',pct:0,until};
  const day = engine.dayBonus([event]);
  assert.deepEqual(day,{type:'BUG',label:'Inseto',xp:20,loot:20,until},'evento real do jogo é lido mesmo com pct zero');
  assert.equal(engine.bestForDay(lowRows,day).hunt.sl,'caterpie','tipo do dia usa o maior XP, sem bônus artificial por vantagem ou defesa');
  assert.equal(engine.dayBonus([{...event,until:Date.now()-1}]),null,'evento vencido é ignorado');
  assert.equal(engine.dayBonus([{...event,name:'Tipo do Dia: Desconhecido'}]),null,'não inventa tipo ausente');
  assert.equal(engine.dayBonus([{...event,name:'Tipo do Dia: Água'}]).type,'WATER','acentos reconhecidos');
  assert.equal(engine.bestForDay([{hunt:{t1:'POISON',t2:'BUG'}}],day).hunt.t2,'BUG','segundo tipo também recebe o bônus');
  assert.equal(engine.bestForDay([],day),null,'sem hunt acessível não recomenda área bloqueada');
  const refreshSource = html.slice(html.indexOf('  async function refreshHuntRecommendations('),html.indexOf('  async function travelToRecommendation('));
  const leaderData = {id:'p',name:'Squirtle',ld:true,level:1,hp:24,hm:24,q:.943,ivt:110,t1:'WATER',stats:lowArgs.attacker.stats};
  const d = {ok:true,live:true,cid:'c',name:'Conta',level:1,team:[leaderData],events:[event]};
  const body = {innerHTML:'',querySelectorAll:()=>[]}, stateUI = {revision:0};
  const view = {executeJavaScript:async script=>script==='state' ? d : catalog};
  const mocks = {hrState:stateUI,hrAccount:{value:'0'},webviews:[view],hrStatus:{},hrBody:body,off:[false],
    hrEl:{classList:{contains:()=>true}},podeModificarPagina:()=>true,READ_STATE:'state',HUNTS_JS:'catalog',
    hrEngine:engine,basesByName:{},movesByName:{},sugCalc,hrProject:project,efTipo,statsParaRecomendacao:()=>({}),
    hrFingerprint:()=>'',t:k=>k,nf:String,esc:String,alertAccountName:()=>'',tipoCor:()=> '#a8b820',
    hrFocus:{value:'xp'},hrPotion:{value:'observed'},hrThreshold:{value:50},hrPotions:{},
    I18N:{pt:{}},clearTimeout:()=>{},setTimeout:()=>1};
  mocks.readAppState = () => view.executeJavaScript('state');
  const refresh = new Function(...Object.keys(mocks),refreshSource+';return refreshHuntRecommendations;')(...Object.values(mocks));
  await refresh();
  assert(body.innerHTML.includes('--day-color:#a8b820'),'borda usa cor do tipo');
  assert(body.innerHTML.indexOf('hr-day')<body.innerHTML.indexOf('hr-section'),'seção do dia aparece antes das recomendações gerais');
  assert(body.innerHTML.includes('+20% XP · +20% loot'),'bônus exibido sem multiplicar medições novamente');
  assert.equal(stateUI.rows[5].hunt.sl,'caterpie','botão separado mantém índice próprio para viagem');
  d.events=[];await refresh();assert(!body.innerHTML.includes('class="hr-day"'),'seção desaparece sem evento ativo');
  assert(rows.length > 20, 'líder real recebe recomendações com o catálogo do jogo');
  assert(rows.every(r => r.hunt.level <= 120 && r.hunt.level > 0 && engine.validSlug(r.hunt.sl)));
  assert(rows.every(r => !r.attack.tm), 'não recomenda TM que o exemplar não aprendeu');
  assert(rows.some(r => r.exposure != null), 'defesa e HP entram na avaliação de resistência');
  assert.deepEqual(engine.rank({ ...args, attacker:{ ...attacker, tlv:0 } }), []);
  const blocked = rows[0].hunt;
  assert(!engine.rank({ ...args, hunts:[{...blocked,blocked:true}] }).length, 'hunt bloqueada é excluída');
  const strong = sugCalc({ ...attacker, stats:{atk:9999,spa:9999} }, rows[0].hunt);
  assert(strong.mg > rows[0].attack.mg, 'ataque observado substitui a projeção');
  const tank = engine.rank({ ...args, attacker:{...attacker,stats:{hp:99999,def:99999,spd:99999}} });
  assert(tank.filter(r => r.risk === 'low').length >= rows.filter(r => r.risk === 'low').length, 'defesas maiores reduzem o risco');
  const measured = engine.rank({ ...args, measurements:{[String(blocked.sl).replace(/[_-]+/g,' ').toLowerCase()]:{xph:12345,kph:50}} });
  const match = measured.find(r => r.hunt.sl === blocked.sl);
  assert.equal(match.xph, 12345, 'medição real daquele Pokémon tem prioridade');
  assert(measured.some(r => !r.measured && r.xph > 0), 'medição calibra XP/h das outras opções');

  // Objetivos independentes, incluindo saldo negativo/zero e hunts sem XP.
  const focusHunts = ['alpha','beta','gamma'].map((sl,i)=>({sl,name:sl,sp:'wild',level:1,xp:[100,10,0][i],t1:'NORMAL',lootValue:10}));
  const focus = {attacker:{sp:'own',level:20,tlv:20,t1:'NORMAL'},hunts:focusHunts,
    project:()=>({hp:100,atk:10,def:10,spa:10,spd:10}),moves:()=>[],effectiveness:()=>1,
    offense:(a,h)=>({ritmo:1,xph:h.xp,nome:'Tackle',eff:1}),
    measurements:{alpha:{xph:1000,kph:100,gph:-500},beta:{xph:10,kph:100,gph:0},gamma:{xph:0,kph:100,gph:500}}};
  const order = (arg,obj) => engine.rank({...arg,objective:obj}).filter(r=>r.viable&&r.score!=null).map(r=>r.hunt.sl);
  assert.deepEqual(order(focus,'xp'),['alpha','beta']);
  assert.deepEqual(order(focus,'gold'),['gamma','beta','alpha'],'dólares aceita zero e prejuízo e não exige XP');
  const changeGold = {...focus,measurements:{alpha:{...focus.measurements.alpha,gph:999999},beta:{...focus.measurements.beta,gph:-999999},gamma:focus.measurements.gamma}};
  assert.deepEqual(order(changeGold,'xp'),order(focus,'xp'),'dólares nunca alteram foco em XP');
  const changeXp = {...focus,hunts:focusHunts.map(h=>({...h,xp:999999})),measurements:Object.fromEntries(Object.entries(focus.measurements).map(([k,m])=>[k,{...m,xph:999999}]))};
  assert.deepEqual(order(changeXp,'gold'),order(focus,'gold'),'XP nunca altera foco em dólares');
  assert(engine.rank({...focus,objective:'gold',measurements:{}}).every(r=>r.gph===null),'sem saldo não inventa renda a partir do preço de venda');
  assert.equal(engine.lootValue([{itemId:1,probability:.5,minQty:1,maxQty:3}],[{id:1,npcPrice:10}]),10);
  assert.equal(engine.lootValue([{itemId:1,chance:50,minQty:1,maxQty:3}],[{id:1,npcPrice:10}]),null,'chance sem unidade conhecida não vira renda');
  const costArgs = {...focus,objective:'gold',potion:{heal:60,price:5},threshold:50,
    moves:()=>[['Tackle',10,'NORMAL','P',1000,1]],measurements:{alpha:{xph:1000,kph:100,gph:999999,lootPerKill:10}}};
  const costRow = engine.rank(costArgs).find(r=>r.hunt.sl==='alpha');
  assert.equal(costRow.goldSource,'estimated');
  assert.equal(costRow.gph,100*(10-1.5/60*5),'poções descontadas da renda, sem usar XP ou descontar saldo histórico de novo');
  assert.equal(engine.rank({...costArgs,potion:{heal:1,price:999}}).find(r=>r.hunt.sl==='alpha').viable,false,'cura insuficiente invalida hunt');
  assert.equal(engine.rank({...costArgs,potion:{heal:60,price:999},objective:'xp'}).find(r=>r.hunt.sl==='alpha').score,
    engine.rank({...costArgs,potion:{heal:60,price:1},objective:'xp'}).find(r=>r.hunt.sl==='alpha').score,'preço da poção não pesa em XP');
  for (const sp of Object.keys(catalog.bs)) {
    const typed = (catalog.mv[sp]||{}).t||[];
    const allArgs = {...args,attacker:{sp,level:3000,q:1.2,ivt:96,tlv:3000,t1:typed[0],t2:typed[1]}};
    for (const objective of ['xp','gold']) assert.doesNotThrow(()=>engine.rank({...allArgs,objective}),sp+' suporta ambos os focos');
  }

  // The actual renderer travel handler must keep summary/grid/focus and the recommendation panel.
  const travelSource=html.slice(html.indexOf('  async function travelToRecommendation('),html.indexOf("  document.getElementById('recommendBtn').onclick"));
  for(const mode of ['summary','grid','focus']) {
    let calls=0,focused=0,closed=0,layoutChanges=0,refreshes=0;
    const leader={id:'leader',name:'Squirtle',ld:true,hp:24,level:1};
    const current={ok:true,live:true,cid:'account-2',level:10,team:[leader]};
    const target={executeJavaScript:async script=>{assert.equal(script,'travel-script');calls++;return {ok:true};},focus:()=>focused++};
    const state={busy:false,context:{i:1,w:target,fingerprint:'same'},rows:[{hunt:{sl:'geodude',name:'Geodude',level:1}}]};
    const go={dataset:{row:'0'},disabled:false,textContent:''},status={};
    const controls=[{},{},{}],cache={0:{d:'keep-other-account'},1:{d:'before-hunt'}};
    const env={hrState:state,hrFocus:controls[0],hrPotion:controls[1],hrThreshold:controls[2],hrAccount:{},
      document:{getElementById:()=>({})},hrBody:{querySelectorAll:()=>[go]},hrStatus:status,
      off:[false,false],webviews:[{},target],podeModificarPagina:()=>true,readAppState:async(i,fresh)=>{assert.equal(i,1);assert.equal(fresh,true);return current;},
      hrFingerprint:()=> 'same',hrEngine:{travelScript:(expected,hunt)=>{assert.equal(expected.cid,'account-2');assert.equal(hunt.sl,'geodude');return 'travel-script';}},
      huntRecovery:{1:{}},stallSlug:['keep','old'],stallOn:[true,true],lastK:[1,2],lastKT:[],stCache:cache,
      t:k=>k,I18N:{pt:{hrOffline:true,hrStale:true,hrUnconfirmed:true}},Date,
      cardsOn:mode==='summary',applyCards:()=>layoutChanges++,closeRecommendations:()=>closed++,refreshCards:()=>refreshes++};
    const travelUI=new Function(...Object.keys(env),travelSource+';return travelToRecommendation;')(...Object.values(env));
    await travelUI(0);
    assert.equal(calls,1,mode+' sends only to the selected account');
    assert.equal(focused+closed+layoutChanges,0,mode+' does not change layout, focus or close recommendations');
    assert.equal(refreshes,mode==='summary'?1:0);
    assert.equal(cache[1],undefined,'only the changed hunt cache is invalidated');assert.deepEqual(cache[0],{d:'keep-other-account'});
    assert(status.textContent.includes('hrDone')&&status.textContent.includes('Geodude'),'confirmation stays visible');
    assert.equal(state.busy,false);assert.equal(go.disabled,false);
    current.cid='changed';env.hrFingerprint=()=> 'changed';
    const staleUI=new Function(...Object.keys(env),travelSource+';return travelToRecommendation;')(...Object.values(env));
    await staleUI(0);assert.equal(calls,1,'changed character never gets a travel command');assert.equal(focused+closed+layoutChanges,0,'failed travel also preserves screen');
  }

  const expected = { cid:'char-1', id:'poke-1', level:100 };
  const hunt = {sl:'abra',level:10};
  assert.equal(engine.travelScript(expected, {sl:"x');alert(1);//",level:10}), null);
  assert.equal(engine.travelScript(expected, {sl:'cerulean',level:1}), null);
  const script = engine.travelScript(expected, hunt);
  function travel(change = {}) {
    const sends = [], timers = [];
    let time = 1000;
    const leader = {id:'poke-1',team:true,leader:true,level:100,hp:200};
    const character = {id:'char-1',level:120};
    const P = {api:{'/api/characters/me':{character}},ws:{pokes:{list:[leader]}},sock:{readyState:1,send:text=>sends.push(JSON.parse(text))},fiT:100,hunting:false,lastSlug:''};
    Object.assign(leader,change.leader); Object.assign(character,change.character); Object.assign(P,change.P);
    const nav = {currentSlug:'cerulean',playerLevel:120,onSelect:(slug,name)=>{nav.currentSlug=slug;P.sock.send(JSON.stringify({type:'enter-hunt',slug}));}};
    const fiber = {memoizedProps:{children:{props:nav}}};
    const document = {querySelectorAll:()=>change.navigation===false ? [] : [{__reactFiber$test:fiber}]};
    const promise = new Function('window','location','document','Date','setInterval','clearInterval','return '+script)(
      {__poke:P},{origin:'https://poke.idleworld.online',pathname:'/play'}, document,{now:()=>time}, fn=>{timers.push(fn);return 1;}, ()=>{});
    return { promise, sends, timers, P, nav, tick:()=>{time=12000;timers.forEach(fn=>fn());} };
  }
  const normal = travel();
  assert.deepEqual(normal.sends,[{type:'enter-hunt',slug:'abra'}], 'clique manda uma única ação de entrada');
  normal.P.hunting=true; normal.P.lastSlug='abra'; normal.P.fiT=200;
  await Promise.resolve();
  normal.timers[0](); assert.equal((await normal.promise).ok,true, 'sucesso exige confirmação do servidor');
  const noMap = travel({navigation:false}); assert.equal((await noMap.promise).reason,'navigation');assert.equal(noMap.sends.length,0,'sem navegação nativa não envia comando isolado');
  const staleMap = travel();await Promise.resolve();staleMap.nav.currentSlug='cerulean';staleMap.P.hunting=true;staleMap.P.lastSlug='abra';staleMap.P.fiT=200;staleMap.tick();assert.equal((await staleMap.promise).ok,false,'field-init sem mapa visível não confirma viagem');
  const stale = travel({leader:{id:'poke-2'}}); assert.equal((await stale.promise).reason,'changed'); assert.equal(stale.sends.length,0);
  const wrongAccount = travel({character:{id:'char-2'}}); assert.equal((await wrongAccount.promise).reason,'changed'); assert.equal(wrongAccount.sends.length,0);
  const low = travel({character:{level:1}}); assert.equal((await low.promise).reason,'locked'); assert.equal(low.sends.length,0);
  const fainted = travel({leader:{hp:0}}); assert.equal((await fainted.promise).reason,'fainted'); assert.equal(fainted.sends.length,0);
  const timeout = travel(); await Promise.resolve();timeout.tick(); assert.equal((await timeout.promise).reason,'unconfirmed'); assert.equal(timeout.sends.length,1,'timeout não inicia repetição automática');
  console.log('Recomendação: tipos, atributos, resistência, níveis, medições e entrada na conta correta aprovados.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
