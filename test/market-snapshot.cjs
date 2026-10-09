const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',path.join(os.tmpdir(),'pokemux-snapshot-test-'+process.pid));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
  try {
    await win.loadURL('data:text/html,<button id="marketBtn">Market</button>');
    for(const source of ['src/domain/pokemon-state.js','src/domain/global-market.js','src/renderer/global-market.js']) await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'..',source),'utf8'));
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const check=(value,message)=>{if(!value)throw Error(message);};
      const pause=()=>new Promise(resolve=>setTimeout(resolve,30));
      let now=100000,version=1,gate=null,reads=[],failed=false;
      const saved={};
      window.PokeMuxMarketAlerts={normalize:x=>x,create:()=>({setRules(){},stop(){},state(){}})};
      const ui=PokeMuxMarketUI.mount({marketReaderOptions:{interval:0,ttl:0},marketSnapshotOptions:{background:false,now:()=>now},
        load:key=>saved[key]||'',save:(key,value)=>{saved[key]=value;},language:()=> 'pt',sprite:()=>'',preferred:()=>0,
        accounts:async()=>[{cid:'c1',name:'Tester',live:true,off:false,focused:true}],rememberFocus(){},
        read:async(_account,script)=>{
          const q=JSON.parse(script.match(/\\}\\)\\((\\{[^\\n]*?\\}),/)[1]);reads.push(q);
          if(q.browse && q.page==='2' && gate)await new Promise(resolve=>gate.push(resolve));
          if(q.browse && q.page==='2' && failed)return {ok:false,reason:'limited'};
          const start=q.page==='2'?12:0,base=version===1?0:1;
          const listings=q.browse?Array.from({length:12},(_,i)=>({id:'listing'+(start+i+base),name:'Abra '+(start+i+base),kind:'pokemon',speciesId:63,level:20,ivTotal:start+i>=12?180:150,quality:1.5,currency:'GOLD',price:(start+i+base+1)*10000})):[{id:'quote',kind:'diamonds',quantity:1,currency:'GOLD',price:10000}];
          return {ok:true,data:{cid:'c1',listings,total:24,pages:2,alertCatalog:[],ownedReady:true,owned:[]}};
        }});
      const el=selector=>document.querySelector(selector);
      await ui.warmCache();
      check(!ui.isOpen() && reads.filter(x=>x.browse).length===2,'complete cache prepared with shop closed');
      check(saved.marketPokemonSnapshots,'completed snapshot persisted');
      await ui.open();await pause();el('[data-category="Pokemon"]').click();await pause();
      const before=reads.length;
      el('#mkSort').value='price-asc';el('#mkSort').dispatchEvent(new Event('change'));await pause();
      check(reads.length===before,'lowest price sorted locally without requests');
      check(el('[data-listing="listing0"]'),'complete cached cheapest listing shown');
      el('#mkIvMin').value='175';el('#mkIvMin').dispatchEvent(new Event('input',{bubbles:true}));await pause();
      check(reads.length===before && el('[data-listing="listing12"]'),'IV filter is local across all cached pages');
      el('#mkClear').click();await pause();
      now+=60001;version=2;gate=[];el('#mkRefresh').click();await pause();
      check(gate.length===1 && el('[data-listing="listing0"]'),'old complete list stable while replacement is incomplete');
      check(!el('#mkResults').textContent.includes('Resultados parciais'),'no partial preview');
      const callbacks=gate;gate=null;callbacks.forEach(resolve=>resolve());await pause();
      check(!el('[data-listing="listing0"]') && el('[data-listing="listing1"]'),'removed listing disappears after complete reconciliation');
      now+=60001;failed=true;el('#mkRefresh').click();await pause();
      check(el('[data-listing="listing1"]'),'failed reconciliation preserves previous complete list');
      ui.close();return 'ok market-snapshot UI: closed-shop warmup, persistence, instant local filters, stable list, removals and failed refresh';
    })()`);
    console.log(result);win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
