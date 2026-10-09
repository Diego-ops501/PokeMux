const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',path.join(os.tmpdir(),'pokemux-market-accounts-'+process.pid));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
  try {
    await win.loadURL('data:text/html,<button id="marketBtn">Market</button>');
    for(const file of ['domain/pokemon-state.js','domain/global-market.js','renderer/global-market.js'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'));
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const check=(ok,message)=>{if(!ok)throw Error(message);}, pause=()=>new Promise(r=>setTimeout(r,50));
      const el=selector=>document.querySelector(selector);
      let opened=-1,iv=null,offline=false,changed=false,transient=false,denied=false,reads=[];
      const accounts=()=>Array.from({length:4},(_,i)=>({cid:changed&&i===2?'new-cid':'c'+i,name:'Conta '+i,live:!(offline&&i===1),off:offline&&i===1}));
      window.PokeMuxMarketAlerts={normalize:x=>x,create:()=>({setRules(){},state(){},check(){},stop(){}})};
      const ui=PokeMuxMarketUI.mount({marketSnapshotOptions:{enabled:false},marketReaderOptions:{interval:0},load:()=>'',save(){},language:()=> 'pt',preferred:()=>0,accounts:async()=>accounts(),sprite:()=>'',rememberFocus(){},openAccount:i=>opened=i,isIvEnabled:()=>true,calculateIv:async(account,pokemon,cid)=>{iv={account,pokemon,cid};return {};},showIv(){},hideIv(){},read:async(account,script)=>{
        const q=JSON.parse(script.match(/\\}\\)\\((\\{[^\\n]*?\\}),/)[1]);reads.push({account,q});
        if(denied&&account===0)return {ok:false,reason:'denied'};
        if(transient&&q.browse==='pokemon'){transient=false;return {ok:false,reason:'changed'};}
        const pokemon={id:'pokemon:same',kind:'pokemon',name:'Rhydon',speciesId:112,level:495,ivTotal:129,quality:1.8,stats:{hp:100+account,atk:200,def:100,spAtk:50,spDef:50,speed:30}};
        return {ok:true,data:{cid:accounts()[account].cid,name:'Conta '+account,pages:1,total:1,ownedReady:true,owned:[pokemon],listings:[{...pokemon,id:'public',currency:'GOLD',price:1000}],mine:[{...pokemon,id:'mine',currency:'GOLD',price:1000+account}],requests:[],catalog:{}}};
      }});
      await ui.open();await pause();check(el('#mkAccount').value==='-1','all accounts selected by default');
      el('[data-tab=compare]').click();await pause();
      check(document.querySelectorAll('[data-owned]').length===4,'four inventories merged with colliding IDs');
      check(el('[data-owned="3|pokemon:same"]').textContent.includes('Conta 3'),'inventory identifies its owner');
      transient=true;el('[data-owned="3|pokemon:same"]').click();await pause();
      check(el('.mk-stats').textContent.includes('103'),'selected specimen retains its own stats');
      check(iv.account===3&&iv.cid==='c3','IV uses the owner account and CID');
      check(!el('#mkResults').textContent.includes('personagem mudou'),'transient session check recovers once');
      check(reads.filter(x=>x.q.browse==='pokemon').every(x=>x.account===0&&x.q.lvMin==='485'&&x.q.gradesOff),'public comparison uses one transport and level/rarity filters');
      el('#mkAccount').value='2';el('#mkAccount').dispatchEvent(new Event('change'));await pause();
      check(document.querySelectorAll('[data-owned]').length===1&&el('[data-owned="2|pokemon:same"]'),'account filter is local');
      el('[data-tab=mine]').click();await pause();check(document.querySelectorAll('[data-listing]').length===1,'own listings honor account filter');
      el('#mkAccount').value='-1';el('#mkAccount').dispatchEvent(new Event('change'));await pause();
      check(document.querySelectorAll('[data-listing]').length===4,'all four accounts listings shown');
      el('[data-open-account="3"]').click();check(opened===3&&!el('#pmMarket').classList.contains('show'),'account link closes market and opens exact owner');
      offline=true;changed=true;await ui.open();await pause();el('[data-tab=compare]').click();await pause();
      check(document.querySelectorAll('[data-owned]').length===3,'offline account excluded and new CID refreshed');
      check(el('.mk-note').textContent.length>0&&el('#mkResults').textContent.includes('Conta 1'),'missing account is visible');
      ui.close();offline=false;denied=true;await ui.open();await pause();
      check(!el('#mkResults').textContent.includes('não autorizou'),'market automatically uses another eligible account');
      ui.close();return 'ok market accounts: four inventories, duplicate IDs, local account filter, listings, owner links, IV isolation, offline, CID recovery and automatic source';
    })()`);
    console.log(result);app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
});
