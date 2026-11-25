// Usage: node seticon.mjs <exe> <ico> [version]
// Replaces the main icon group of a Windows .exe (pure JS, no wine) and sets file description/version.
import * as ResEdit from 'resedit';
import * as PE from 'pe-library';
import fs from 'fs';
const [exe,ico,ver='3.4.0']=process.argv.slice(2);
const exeData=PE.NtExecutable.from(fs.readFileSync(exe),{ignoreCert:true});
const res=PE.NtExecutableResource.from(exeData);
const iconFile=ResEdit.Data.IconFile.from(fs.readFileSync(ico));
const groups=ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
const id=groups.length?groups[0].id:1,lang=groups.length?groups[0].lang:1033;
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries,id,lang,iconFile.icons.map(i=>i.data));
const vi=ResEdit.Resource.VersionInfo.fromEntries(res.entries);
if(vi.length){const v=vi[0];const [a,b,c]=ver.split('.').map(Number);
  v.setFileVersion(a,b,c,0,1033);v.setProductVersion(a,b,c,0,1033);
  v.setStringValues({lang:1033,codepage:1200},{FileDescription:'Logic Lab',ProductName:'Logic Lab',FileVersion:ver,ProductVersion:ver});
  v.outputToResourceEntries(res.entries)}
res.outputResource(exeData);
fs.writeFileSync(exe,Buffer.from(exeData.generate()));
console.log('icon set:',exe,'group',id);
