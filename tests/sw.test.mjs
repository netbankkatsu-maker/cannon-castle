import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const origin='https://cannon.test',source=new URL('../src/',import.meta.url);
const read=name=>readFile(new URL(name,source),'utf8');
const key=input=>new URL(typeof input==='string'?input:input.url,origin).href;
async function harness(){
 const listeners=new Map(),stores=new Map(),calls=[];let offline=false,skipped=false,claimed=false;
 const fetch=async(input,options)=>{const url=key(input);calls.push({url,options});if(offline)throw Error('offline');const parsed=new URL(url);if(parsed.origin!==origin)return new Response('cdn-library');try{return new Response(await read(parsed.pathname==='/'?'index.html':parsed.pathname.slice(1)));}catch{return new Response('not found',{status:404});}};
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {async match(input){return store.get(key(input))?.clone();},async put(input,response){store.set(key(input),response.clone());},async addAll(inputs){for(const input of inputs){const response=await fetch(input);if(!response.ok)throw Error('cache fetch failed');store.set(key(input),response.clone());}}};},async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}};
 const self={location:{origin},addEventListener:(name,handler)=>listeners.set(name,handler),async skipWaiting(){skipped=true;},clients:{async claim(){claimed=true;}}};
 vm.runInNewContext(await read('sw.js'),{self,caches,fetch,URL,Response});
 return {stores,calls,caches,get skipped(){return skipped;},get claimed(){return claimed;},set offline(value){offline=value;},async lifecycle(name){let promise;listeners.get(name)({waitUntil(p){promise=p;}});await promise;},async request(path,{mode='cors',method='GET'}={}){let promise;listeners.get('fetch')({request:{url:key(path),method,mode},respondWith(p){promise=p;}});return promise?await promise:undefined;}};
}
async function moduleGraph(path,seen=new Set()){
 const url=new URL(path,origin);if(url.origin!==origin||seen.has(url.pathname))return seen;seen.add(url.pathname);
 const content=await read(url.pathname.slice(1));
 for(const match of content.matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g)){const dependency=new URL(match[1],url);if(dependency.origin===origin){assert.equal(dependency.search,'?v=10',`unversioned import in ${url.pathname}`);await moduleGraph(dependency.href,seen);}}
 return seen;
}
test('install caches complete version 10 module graph, shell and CDN dependencies',async()=>{
 const app=await harness();await app.lifecycle('install');assert.equal(app.skipped,true);const store=app.stores.get('cannon-castle-v10');assert.ok(store);
 const html=await read('index.html');assert.match(html,/style\.css\?v=10/);assert.match(html,/game\.js\?v=10/);assert.match(html,/pwa\.js\?v=10/);
 const graph=await moduleGraph('/game.js?v=10');assert.ok(graph.size>=11);for(const file of graph){assert.ok(store.has(key(file+'?v=10')),`missing cached dependency ${file}`);assert.ok(store.has(key(file)));}
 for(const name of ['/','/index.html','/pwa.js?v=10','/style.css?v=10','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/apple-touch-icon.png'])assert.ok(store.has(key(name)),name);
 const cdn=[...store.keys()].filter(url=>new URL(url).origin!==origin);assert.equal(cdn.length,2);assert.ok(cdn.some(url=>url.includes('three@0.160.1')));assert.ok(cdn.some(url=>url.includes('cannon-es@0.20.0')));
});
test('activate removes old game caches while preserving unrelated applications',async()=>{const app=await harness();await app.caches.open('cannon-castle-v9');await app.caches.open('other-game-v1');await app.lifecycle('install');await app.lifecycle('activate');assert.equal(app.stores.has('cannon-castle-v9'),false);assert.equal(app.stores.has('cannon-castle-v10'),true);assert.equal(app.stores.has('other-game-v1'),true);assert.equal(app.claimed,true);});
test('offline navigation restores shell and every versioned module',async()=>{const app=await harness();await app.lifecycle('install');app.offline=true;const response=await app.request('/unvisited',{mode:'navigate'});assert.equal(await response.text(),await read('index.html'));for(const file of await moduleGraph('/game.js?v=10')){const module=await app.request(file+'?v=10');assert.equal(module.status,200);assert.equal(await module.text(),await read(file.slice(1)));}const missing=await app.request('/missing.mjs?v=10');assert.equal(missing.type,'error');});
test('local assets revalidate online; CDN is cache first and foreign writes are ignored',async()=>{const app=await harness();await app.lifecycle('install');app.calls.length=0;await app.request('/game.js?v=10');assert.equal(app.calls[0].options.cache,'no-cache');const before=app.calls.length;const cdn=[...app.stores.get('cannon-castle-v10').keys()].find(url=>url.includes('three@'));assert.equal(await (await app.request(cdn)).text(),'cdn-library');assert.equal(app.calls.length,before);assert.equal(await app.request('https://unrelated.test/file'),undefined);assert.equal(await app.request('/game.js',{method:'POST'}),undefined);});
