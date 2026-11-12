import {cp,mkdir,rm,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dist=join(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
for(const path of ['index.html','styles.css','src','data'])await cp(join(root,path),join(dist,path),{recursive:true});
// App Studio's parent assembler fingerprints the final deployed assets once.
// Emitting a manifest here would make the parent include and then replace itself.
let count=0;async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.isDirectory())await scan(join(dir,entry.name));else count++;}}await scan(dist);
console.log(`Built Rare Metals Lab: ${count} resources; final inventory belongs to App Studio`);
