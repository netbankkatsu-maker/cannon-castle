import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../src/',import.meta.url)).replace(/\/$/,'');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript'};
createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return}const name=path===root?resolve(root,'index.html'):path;const bytes=await readFile(name);res.writeHead(200,{'Content-Type':mime[extname(name)]||'application/octet-stream'}).end(bytes);}catch{res.writeHead(404).end('Not found')}}).listen(3000,'0.0.0.0',()=>console.log('http://localhost:3000'));
