const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',path.join(os.tmpdir(),'pokemux-item-prices-'+process.pid));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
  try {
    await win.loadURL('data:text/html,<button id="marketBtn">Market</button>');
    for(const file of ['domain/pokemon-state.js','domain/global-market.js','renderer/global-market.js'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'));
    console.log(await win.webContents.executeJavaScript(`(async()=>{
      const check=(v,message)=>{if(!v)throw Error(message);};let clock=100000,reads=0,mode='ok';const original=Date.now;Date.now=()=>clock;
      window.PokeMuxMarketAlerts={normalize:x=>x,create:()=>({setRules(){},stop(){},state(){}})};
      const accounts=Array.from({length:4},(_,i)=>({cid:'character'+i,live:true,off:false,name:'Conta '+i}));
      const ui=PokeMuxMarketUI.mount({marketSnapshotOptions:{enabled:false},marketReaderOptions:{interval:0,now:()=>clock},load:()=>'',save(){},language:()=> 'pt',preferred:()=>0,accounts:async()=>accounts,sprite:()=>'',read:async(account)=>{
        reads++;if(mode==='limited')return {ok:false,reason:'limited'};if(account===0 && mode!=='open')return {ok:false,reason:'denied'};
        return {ok:true,data:{cid:mode==='changed'?'wrong':accounts[account].cid,listings:[{kind:'item',refId:70000,currency:'GOLD',price:mode==='changed'?1:16000000,quantity:2},{kind:'item',refId:70000,currency:'DIAMONDS',price:7,quantity:1}]}};
      }});
      try {
        const quotes=await Promise.all(Array.from({length:12},()=>ui.itemPrices()));
        check(reads===2,'one public query with automatic source fallback, not per item/account');
        check(quotes.every(x=>x.ok && x.prices['item:70000'].GOLD===16000000 && x.prices['item:70000'].DIAMONDS===7),'minimum for each currency');
        await ui.itemPrices();check(reads===2,'cache reused');clock+=61000;mode='limited';
        const limited=await ui.itemPrices();check(!limited.ok && limited.reason==='limited' && limited.prices['item:70000'].GOLD===16000000,'failure preserves previous prices with explicit status');check(reads===3,'rate limit stops fallback loop');
        await ui.itemPrices();check(reads===3,'market queue cooldown prevents more HTTP requests');
        clock+=61000;mode='changed';const changed=await ui.itemPrices();check(!changed.ok && changed.prices['item:70000'].GOLD===16000000,'wrong character response does not poison quote cache');
        clock+=61000;mode='open';await ui.open();await new Promise(resolve=>setTimeout(resolve,60));const before=reads;const reused=await ui.itemPrices();check(reused.ok && reads===before,'inventory reuses All response from normal market opening');
        return 'Preços dos itens: mínimos por moeda, consulta compartilhada, cache, origem automática, limite do jogo e personagem aprovados.';
      }finally{ui.close();Date.now=original;}
    })()`));
  }catch(e){console.error(e);process.exitCode=1;}finally{win.destroy();app.exit(process.exitCode||0);}
});
