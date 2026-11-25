const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  loadSave:()=>ipcRenderer.sendSync('save:load'),
  writeSave:data=>ipcRenderer.sendSync('save:write',data),
  steamLang:()=>ipcRenderer.sendSync('steam:lang'),
  achievement:id=>ipcRenderer.send('steam:ach',id),
  setSize:(w,h)=>ipcRenderer.invoke('win:size',w,h),
  setFullScreen:on=>ipcRenderer.invoke('win:fs',on),
  onFullScreen:cb=>ipcRenderer.on('win:fs-changed',(e,on)=>cb(on)),
  quit:()=>ipcRenderer.send('app:quit')
});
