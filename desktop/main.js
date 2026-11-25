// Logic Lab — desktop/Steam shell.
// Steam App ID: for local testing put it in steam_appid.txt next to the exe (480 = Valve's test app).
// The release depot excludes steam_appid.txt: when launched from Steam the client provides the ID.
const {app,BrowserWindow,Menu,ipcMain}=require('electron');
const path=require('path'),fs=require('fs');

let steam=null,steamworks=null;
function appId(){
  for(const p of [path.join(process.resourcesPath||'','..','steam_appid.txt'),path.join(__dirname,'steam_appid.txt'),path.join(process.cwd(),'steam_appid.txt')]){
    try{const v=parseInt(fs.readFileSync(p,'utf8'),10);if(v)return v}catch(e){}
  }
  return undefined; // released build: Steam passes the App ID itself
}
try{
  steamworks=require('steamworks.js');
  steam=steamworks.init(appId());
  steamworks.electronEnableSteamOverlay();
}catch(e){steam=null;console.log('Steam not available:',e.message)}

// One save file in the user data folder. Configure Steam Auto-Cloud to sync it (see STEAM.md).
const saveDir=()=>path.join(app.getPath('userData'),'save');
const saveFile=()=>path.join(saveDir(),'logiclab-save.json');
ipcMain.on('save:load',e=>{try{e.returnValue=fs.readFileSync(saveFile(),'utf8')}catch(err){e.returnValue=''}});
ipcMain.on('save:write',(e,data)=>{
  try{fs.mkdirSync(saveDir(),{recursive:true});const tmp=saveFile()+'.tmp';fs.writeFileSync(tmp,data);fs.renameSync(tmp,saveFile())}catch(err){console.error(err)}
  e.returnValue=true;
});
ipcMain.on('steam:lang',e=>{try{e.returnValue=steam?steam.apps.currentGameLanguage():''}catch(err){e.returnValue=''}});
ipcMain.on('steam:ach',(e,id)=>{try{if(steam&&!steam.achievement.isActivated(id))steam.achievement.activate(id)}catch(err){}});
ipcMain.handle('win:size',(e,wd,ht)=>{const w=BrowserWindow.fromWebContents(e.sender);if(w.isFullScreen())w.setFullScreen(false);w.setSize(wd,ht);w.center()});
ipcMain.handle('win:fs',(e,on)=>BrowserWindow.fromWebContents(e.sender).setFullScreen(!!on));
ipcMain.on('app:quit',()=>app.quit());

Menu.setApplicationMenu(null);
app.whenReady().then(()=>{
  const w=new BrowserWindow({width:1280,height:800,minWidth:800,minHeight:560,backgroundColor:'#F3F2EE',title:'Logic Lab',icon:path.join(__dirname,'icon.png'),autoHideMenuBar:true,show:false,
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,sandbox:false}});
  w.once('ready-to-show',()=>w.show());
  w.on('enter-full-screen',()=>w.webContents.send('win:fs-changed',true));
  w.on('leave-full-screen',()=>w.webContents.send('win:fs-changed',false));
  w.webContents.on('before-input-event',(ev,inp)=>{if(inp.key==='F11'&&inp.type==='keyDown')w.setFullScreen(!w.isFullScreen())});
  w.loadFile('index.html');
});
app.on('window-all-closed',()=>app.quit());
