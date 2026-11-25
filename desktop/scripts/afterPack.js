// electron-builder hook: put Bit's icon and the version into the Windows .exe.
// Pure JavaScript (resedit), so it works on Linux and macOS without wine.
const path=require('path'),{execFileSync}=require('child_process');
exports.default=async ctx=>{
  if(ctx.electronPlatformName!=='win32')return;
  const exe=path.join(ctx.appOutDir,ctx.packager.appInfo.productFilename+'.exe');
  const ico=path.join(__dirname,'..','build','icon.ico');
  execFileSync(process.execPath,[path.join(__dirname,'seticon.mjs'),exe,ico,ctx.packager.appInfo.version],{stdio:'inherit'});
};
