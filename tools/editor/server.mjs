import http from 'node:http';
import {readFile,writeFile,mkdir,readdir,rename,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {validateNote} from '../../src/note-format.js';
import {publicationHTML} from './publication.mjs';
import {zip} from './zip.mjs';

const here=fileURLToPath(new URL('.',import.meta.url)),root=resolve(here,'../..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm'};
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const uid=()=>randomBytes(12).toString('hex');
const draftId=value=>{if(!/^[a-f0-9]{24}$/.test(value||''))throw fail('Rascunho inválido.');return value;};
async function body(req,limit){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw fail('Arquivo acima do limite permitido.',413);chunks.push(chunk);}return Buffer.concat(chunks);}
function detectedType(data){
  if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
  if(data[0]===255&&data[1]===216&&data[2]===255)return 'jpg';
  if(data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP')return 'webp';
  if(data.toString('ascii',4,8)==='ftyp'&&/^(isom|iso[2-9]|mp4[12]|avc1|M4V |MSNV)/.test(data.toString('ascii',8,12)))return 'mp4';
  if(data.subarray(0,4).equals(Buffer.from([26,69,223,163]))&&data.subarray(0,128).includes(Buffer.from('webm')))return 'webm';
  throw fail('Use PNG, JPEG, WebP, MP4 ou WebM. O conteúdo do arquivo deve corresponder ao formato.');
}

export async function createEditorServer({dataDir=resolve(root,'.stargaze-editor'),port=4318}={}){
  const drafts=resolve(dataDir,'drafts'),media=resolve(dataDir,'media');
  await mkdir(drafts,{recursive:true});await mkdir(media,{recursive:true});
  async function save(note){
    const id=draftId(note.id),errors=validateNote(note,{draft:true});if(errors.length)throw fail(errors.join(' '));
    for(const item of note.media||[])await stat(resolve(media,item.file)).catch(()=>{throw fail('Uma mídia não foi encontrada neste computador.');});
    const clean={...note,status:'draft',updatedAt:new Date().toISOString()};
    const target=resolve(drafts,`${id}.json`),tmp=target+`.${uid()}.tmp`;
    await writeFile(tmp,JSON.stringify(clean,null,2));await rename(tmp,target);return clean;
  }
  const load=async id=>JSON.parse(await readFile(resolve(drafts,`${draftId(id)}.json`),'utf8'));
  async function storeMedia(data){
    const ext=detectedType(data),kind=['mp4','webm'].includes(ext)?'video':'image';
    if(data.length>(kind==='video'?50:12)*1024*1024)throw fail(kind==='video'?'Vídeo acima de 50 MB.':'Imagem acima de 12 MB.',413);
    const id=`asset-${uid()}`,file=`${id}.${ext}`;await writeFile(resolve(media,file),data,{flag:'wx'});return{id,file,kind,alt:'',caption:''};
  }
  const server=http.createServer(async(req,res)=>{
    const send=(status,value,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});res.end(typeof value==='object'&&!Buffer.isBuffer(value)?JSON.stringify(value):value);};
    try{
      const origin=`http://127.0.0.1:${server.address().port}`;
      if(req.headers.host!==new URL(origin).host)throw fail('Abra o endereço 127.0.0.1 mostrado no terminal.',403);
      if(req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&req.headers.origin!==origin))throw fail('Origem não autorizada.',403);
      const url=new URL(req.url,origin),path=url.pathname;
      if(path.startsWith('/api/')&&req.headers['x-stargaze-editor']!=='1')throw fail('Requisição fora do caderno local.',403);
      if(req.method==='POST'&&req.headers.origin!==origin)throw fail('Origem local obrigatória.',403);
      const staticFiles={'/':'index.html','/editor.js':'editor.js','/editor.css':'editor.css','/note-format.js':'../../src/note-format.js'};
      if(req.method==='GET'&&Object.hasOwn(staticFiles,path))return send(200,await readFile(resolve(here,staticFiles[path])),types[extname(staticFiles[path])]||'text/javascript; charset=utf-8');
      if(req.method==='GET'&&path.startsWith('/media/')){
        const file=path.slice(7);if(!/^asset-[a-f0-9]{24}\.(png|jpg|webp|mp4|webm)$/.test(file))throw fail('Arquivo inválido.',404);
        const data=await readFile(resolve(media,file)),type=types[extname(file)];
        if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!match)throw fail('Intervalo inválido.',416);const start=Number(match[1]),end=Math.min(match[2]?Number(match[2]):data.length-1,data.length-1);if(start>end)throw fail('Intervalo inválido.',416);res.setHeader('Content-Range',`bytes ${start}-${end}/${data.length}`);res.setHeader('Accept-Ranges','bytes');return send(206,data.subarray(start,end+1),type);}
        return send(200,data,type);
      }
      if(req.method==='GET'&&path==='/api/drafts'){
        const items=await Promise.all((await readdir(drafts)).filter(f=>/^[a-f0-9]{24}\.json$/.test(f)).map(async file=>JSON.parse(await readFile(resolve(drafts,file),'utf8'))));
        return send(200,items.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
      }
      if(req.method==='POST'&&path==='/api/save')return send(200,await save(JSON.parse((await body(req,1024*1024)).toString())));
      if(req.method==='POST'&&path==='/api/preview'){
        const note=JSON.parse((await body(req,1024*1024)).toString()),errors=validateNote(note,{draft:true});if(errors.length)throw fail(errors.join(' '));
        return send(200,publicationHTML(note,{preview:true,mediaBase:'/media/'}),'text/html; charset=utf-8');
      }
      if(req.method==='POST'&&path==='/api/media')return send(200,await storeMedia(await body(req,50*1024*1024)));
      if(req.method==='POST'&&path==='/api/import'){
        const note=JSON.parse((await body(req,9*1024*1024)).toString());
        const errors=validateNote(note,{draft:true});if(errors.length)throw fail(errors.join(' '));
        if(note.schemaVersion!==1)throw fail('Importe um JSON do caderno anterior. As notas atuais já ficam salvas no computador.');
        const attachments=[];for(const item of note.images){const m=await storeMedia(Buffer.from(item.data.split(',')[1],'base64'));attachments.push({...m,alt:item.alt,caption:item.caption});}
        return send(200,await save({...note,id:uid(),schemaVersion:2,images:[],media:attachments}));
      }
      if(req.method==='POST'&&path==='/api/export'){
        const {id}=JSON.parse((await body(req,1024)).toString()),draft=await load(id),note={...draft,status:'published'};
        const errors=validateNote(note);if(errors.length)throw fail(errors.join(' '));
        delete note.id;delete note.updatedAt;
        const prefix=`public/notes/${note.slug}/`,entries=[[`${prefix}index.html`,publicationHTML(note)],[`content/notes/${note.slug}.json`,JSON.stringify(note,null,2)]];
        let total=0;for(const item of note.media){const data=await readFile(resolve(media,item.file));total+=data.length;if(total>200*1024*1024)throw fail('O pacote excede 200 MB. Divida a publicação ou reduza os vídeos.');entries.push([`${prefix}media/${item.file}`,data]);}
        entries.push(['LEIA-ME.txt',`STARGAZE / FIELD NOTES\n\nNada foi publicado online.\n\n1. Extraia este ZIP na raiz da cópia de revisão do site, unindo as pastas content e public.\n2. Execute npm run build. A home incluirá a nota e a página estará em /notes/${note.slug}/.\n3. Publique a pasta dist com o fluxo habitual, depois de revisar.\n\nA página public/notes/${note.slug}/index.html também abre diretamente, com as mídias ao lado.\nPara revisar uma nota já publicada, conserve o slug e substitua apenas os arquivos dessa nota.\nO texto é exatamente o que você escreveu. O rascunho continua salvo no seu computador.\n`]);
        res.setHeader('Content-Disposition',`attachment; filename="${note.slug}.zip"`);return send(200,zip(entries),'application/zip');
      }
      throw fail('Página não encontrada.',404);
    }catch(error){send(error.status||(error.code==='ENOENT'?404:400),{error:error.code==='ENOENT'?'Arquivo não encontrado.':error.message});}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  createEditorServer().then(server=>{console.log(`\nStargaze / Caderno local\nAbra http://127.0.0.1:${server.address().port}\nRascunhos: ${resolve(root,'.stargaze-editor')}\nPara encerrar: Ctrl+C\n`);}).catch(error=>{console.error(error.code==='EADDRINUSE'?'O caderno já pode estar aberto em http://127.0.0.1:4318.':error.message);process.exitCode=1;});
}
