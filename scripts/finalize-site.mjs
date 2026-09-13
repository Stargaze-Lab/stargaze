import {cp,access} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
const root=resolve(import.meta.dirname,'..');
// Include the existing standalone studies in both local and Pages builds.
for(const name of ['colony','wikiverso','string-tuner','experimento-01']){
  const source=resolve(root,name);
  try{await access(source);}catch{continue;}
  await cp(source,resolve(root,'dist',name),{recursive:true,filter:path=>!['.git','node_modules','.DS_Store'].includes(basename(path))&&!basename(path).startsWith('.env')});
}
console.log('Standalone studies copied into the publication output.');
