// Capture the real 2.0 renderer in three languages using fictional, isolated data.
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');
app.setPath('userData',path.join(os.tmpdir(),'pokemux-ui-docs-'+process.pid));
app.on('web-contents-created',(_event,contents)=>{
  contents.session.webRequest.onBeforeRequest({urls:['https://*/*','http://*/*']},(details,callback)=>callback({cancel:!details.url.startsWith('https://raw.githubusercontent.com/PokeAPI/sprites/')}));
  contents.on('will-attach-webview',(_event,_preferences,parameters)=>{parameters.src='about:blank';});
});
const preload=fs.readFileSync(path.join(root,'preload.js'),'utf8');
for(const channel of new Set([...preload.matchAll(/ipcRenderer.invoke\('([^']+)'/g)].map(m=>m[1])))ipcMain.handle(channel,()=>channel==='creds:load'?['Aurora','Boreal','Citrino','Dourado'].map((name,i)=>({name,email:'demo-'+i,senha:''})):false);
ipcMain.on('app:version',event=>{event.returnValue=require('../package.json').version;});
app.whenReady().then(async()=>{
  const win=new BrowserWindow({width:1440,height:950,useContentSize:true,show:false,webPreferences:{preload:path.join(root,'preload.js'),webviewTag:true,contextIsolation:true,sandbox:true,backgroundThrottling:false}});
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  try{
    await win.loadFile(path.join(root,'index.html'));
    await win.webContents.executeJavaScript(`(async()=>{
      for(let n=0;n<40&&!workspaceUI;n++)await new Promise(r=>setTimeout(r,50));
      const names=['Aurora','Boreal','Citrino','Dourado'],species=[112,127,89,91],pokemon=['Rhydon','Pinsir','Muk','Cloyster'];
      window.docsStates=[];
      window.docsRead=(i)=>({ok:true,complete:true,cid:'demo-'+i,rows:[
        ...Array.from({length:5},(_,n)=>({id:'demo-poke-'+i+'-'+n,kind:'pokemon',name:pokemon[i],speciesId:species[i],level:n?20+n:498-i*12,iv:175-n*4,quality:Number((1.8-n*.12).toFixed(3)),quantity:1,team:!n,stats:{}})),
        {id:'item:44417',kind:'item',name:'Strange Pheromone',quantity:2+i,npcPrice:1000000},
        {id:'item:70000',kind:'item',name:'Bronze Boss Token',quantity:4+i,npcPrice:250000},
        {id:'item:203',kind:'item',name:'Hyper Potion',quantity:2400+i*700,npcPrice:800},
        {id:'item:97',kind:'item',name:'Pinsir Horn',quantity:3100+i*400,npcPrice:500}]});
      marketUI.itemPrices=async()=>({ok:true,at:Date.now(),prices:{'item:44417':{GOLD:33000000,DIAMONDS:13},'item:70000':{GOLD:15000000,DIAMONDS:7},'item:203':{GOLD:900},'item:97':{GOLD:650}}});
      webviews.forEach((view,i)=>{
        const d={ok:true,live:true,cid:'demo-'+i,name:names[i],farm:{hunting:true,lastCombatT:Date.now()},hasBalls:true,hasInv:true,balls:19427,potions:5925,ballMap:{1:19427},team:[{name:pokemon[i],sid:species[i],level:498-i*12,ivt:175,q:1.8,ld:true,hp:100,hm:100}],a:{seconds:3600,gph:3000000+i*800000,xph:12000000+i*1000000,kph:815,captures:37,ballsUsed:100,potsUsed:10},hunt:'Furious Scyther',usedList:[],invMap:{},catchLog:[]};
        docsStates[i]=d;view.getURL=()=> 'https://poke.idleworld.online/play';view.executeJavaScript=async script=>script.includes('const complete = await new Promise')?docsRead(i):d;
        rememberAccountName(i,d.name,d.cid);stCache[i]={t:Date.now(),d,slot:stateSlot(i)};
      });
      workspaceUI.refresh();
    })()`);
    const capture=async name=>{
      await win.webContents.executeJavaScript("docsStates.forEach((d,i)=>{stCache[i]={t:Date.now(),d,slot:stateSlot(i)};workspaceLive[i]={at:Date.now(),view:webviews[i],email:accounts[i].email,cid:d.cid,live:true};});workspaceUI.refresh()");
      win.showInactive();await pause(500);
      await win.webContents.executeJavaScript(`Promise.race([Promise.all([...document.images].filter(x=>x.getBoundingClientRect().height>0).map(x=>x.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,4000))])`);
      fs.writeFileSync(path.join(root,'docs',name+'.png'),(await win.capturePage()).toPNG());win.hide();console.log('Rendered docs/'+name+'.png');
    };
    for(const language of ['pt','en','es']){
      await win.webContents.executeJavaScript(`lang='${language}';applyLang();cardsOn=true;applyCards();`);await pause(300);
      await capture('resumo-'+language);
      await win.webContents.executeJavaScript('inventoryUI.open()');await pause(200);
      const expected=language==='en'?'Account inventories':language==='es'?'Inventarios de las cuentas':'Inventário das contas';
      const actual=await win.webContents.executeJavaScript("document.querySelector('#inventoryTitle').textContent");
      if(actual!==expected)throw Error('Inventory language mismatch: '+actual);
      await capture('inventario-'+language);
      await win.webContents.executeJavaScript('inventoryUI.close();settingsUI.open("performance")');await pause(100);
      await capture('ajustes-'+language);
      await win.webContents.executeJavaScript('closeSettings()');
    }
  }catch(error){console.error(error);process.exitCode=1;}finally{win.destroy();app.exit(process.exitCode||0);}
});
