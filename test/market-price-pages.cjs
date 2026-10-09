const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',path.join(os.tmpdir(),'pokemux-price-pages-'+process.pid));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
  try {
    await win.loadURL('data:text/html,<button id="marketBtn">Market</button>');
    for(const source of ['src/domain/pokemon-state.js','src/domain/global-market.js','src/renderer/global-market.js'])await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'..',source),'utf8'));
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const check=(value,message)=>{if(!value)throw Error(message);};
      const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms||30));let reads=[];
      const gold=Array.from({length:124},(_,i)=>({id:'g'+i,name:'Abra',kind:'pokemon',speciesId:63,ivTotal:180,level:20,quality:1.5,currency:'GOLD',price:400000+i*100000}));
      const diamonds=Array.from({length:605},(_,i)=>({id:'d'+i,name:'Abra',kind:'pokemon',speciesId:63,ivTotal:180,level:20,quality:1.5,currency:'DIAMONDS',price:3+i}));
      window.PokeMuxMarketAlerts={normalize:x=>x,create:()=>({setRules(){},stop(){},state(){}})};
      const ui=PokeMuxMarketUI.mount({marketReaderOptions:{interval:0,ttl:0},marketSnapshotOptions:{background:false},load:()=>'',save(){},language:()=> 'pt',sprite:()=>'',preferred:()=>0,
        accounts:async()=>[{cid:'c1',name:'Tester',live:true,off:false,focused:true}],rememberFocus(){},
        read:async(_account,script)=>{
          const q=JSON.parse(script.match(/\\}\\)\\((\\{[^\\n]*?\\}),/)[1]);reads.push(q);
          let list=q.currency==='GOLD'?gold:q.currency==='DIAMONDS'?diamonds:[...gold,...diamonds];
          if(q.sort==='price-desc')list=[...list].reverse();
          const start=(Number(q.page||1)-1)*12;
          return {ok:true,data:{cid:'c1',listings:q.browse?list.slice(start,start+12):[{id:'quote',kind:'diamonds',quantity:1,currency:'GOLD',price:2700000}],total:list.length,pages:Math.ceil(list.length/12),owned:[],ownedReady:true,alertCatalog:[]}};
        }});
      const el=selector=>document.querySelector(selector);
      await ui.open();await pause();el('[data-category="Pokemon"]').click();await pause();
      el('#mkIvMin').value='175';el('#mkIvMin').dispatchEvent(new Event('input',{bubbles:true}));await pause(800);
      reads=[];el('#mkSort').value='price-asc';el('#mkSort').dispatchEvent(new Event('change'));await pause(800);
      check(reads.length===2 && reads.every(q=>q.ivMin==='175'&&q.currency&&q.page==='1'),'729 filtered listings sorted with two initial currency pages');
      check(el('[data-listing="g0"]')&&el('[data-listing="g11"]')&&!el('[data-listing="d0"]'),'true globally cheapest twelve displayed');
      check(el('#mkCount').textContent.includes('729')&&el('.mk-pages').textContent.includes('61'),'full totals and global pagination retained');
      reads=[];el('[data-page="2"]').click();await pause();
      check(reads.length===1&&reads[0].currency==='GOLD'&&reads[0].page==='2','next global page reads only one additional frontier');
      check(el('[data-listing="g12"]')&&el('[data-listing="g23"]'),'next page remains correctly ordered');
      el('[data-page="1"]').click();await pause();
      check(reads.length===1&&el('[data-listing="g0"]'),'return to merged page needs no request');
      check(!el('#mkResults').textContent.includes('Resultados parciais'),'no partial ranking');
      ui.close();return 'ok market-price-pages UI: IV 175, 729 listings, two requests, exact ordering and on-demand pagination';
    })()`);
    console.log(result);win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
