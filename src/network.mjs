import {UPGRADES,canPurchase} from './progression.mjs?v=13';
export function pinchTransform({scale,offset,points},current,rect){
 const distance=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
 const center=p=>({x:(p[0].x+p[1].x)/2-rect.left,y:(p[0].y+p[1].y)/2-rect.top});
 const before=center(points),after=center(current);
 const next=Math.max(.68,Math.min(1.8,scale*distance(current)/Math.max(1,distance(points))));
 return {scale:next,offset:{x:after.x-(before.x-offset.x)*next/scale,y:after.y-(before.y-offset.y)*next/scale}};
}
export function createNetwork({root,getState,onOpen,onClose,onBuy,nodes=UPGRADES,title="強化網",currency="刻印片",canBuy=canPurchase}) {
 const dialog=document.createElement('dialog');dialog.className='network-dialog';const titleId=nodes[0].id+'-network-title';dialog.setAttribute('aria-labelledby',titleId);
 dialog.innerHTML=`<header class="network-header"><h2 id="${titleId}">${title}</h2><span data-network-coins></span><button type="button" data-close aria-label="${title}を閉じる">✕</button></header><div class="network-map"><div class="network-world"><svg class="network-links" viewBox="0 0 800 800" aria-hidden="true"></svg></div></div><section class="network-detail" aria-live="polite"><b data-node-name></b><p data-node-description></p><small data-node-requires></small><button type="button" data-node-buy></button></section>`;
 root.append(dialog);
 const map=dialog.querySelector('.network-map'),world=dialog.querySelector('.network-world'),svg=dialog.querySelector('svg'),buttons=new Map(),links=[];
 for(const node of nodes){
  for(const id of node.requires){const parent=nodes.find(n=>n.id===id),line=document.createElementNS('http://www.w3.org/2000/svg','path');line.setAttribute('d',`M ${parent.x} ${parent.y} C ${parent.x} ${(parent.y+node.y)/2}, ${node.x} ${(parent.y+node.y)/2}, ${node.x} ${node.y}`);svg.append(line);links.push({line,id:node.id,parent:id});}
  const button=document.createElement('button');button.type='button';button.className='network-node';button.style.left=node.x+'px';button.style.top=node.y+'px';button.innerHTML=`<b>${node.name}</b><small></small>`;button.addEventListener('click',()=>{if(moved)return;selected=node.id;refresh();});button.addEventListener('focus',()=>{if(!dialog.open||pointers.size)return;const x=node.x*scale+offset.x,y=node.y*scale+offset.y;if(x<70||x>map.clientWidth-70||y<45||y>map.clientHeight-45){offset={x:map.clientWidth/2-node.x*scale,y:map.clientHeight/2-node.y*scale};transform();}});world.append(button);buttons.set(node.id,button);
 }
 let selected=nodes[0].id,scale=1,offset={x:0,y:0},moved=false,gesture=null;const pointers=new Map();
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function transform(){const width=map.clientWidth,height=map.clientHeight;offset.x=clamp(offset.x,Math.min(16,width-800*scale-16),16);offset.y=clamp(offset.y,Math.min(16,height-800*scale-16),16);world.style.transform=`translate(${offset.x}px,${offset.y}px) scale(${scale})`;}
 function refresh(){const {owned,coins}=getState();dialog.querySelector('[data-network-coins]').textContent=new Intl.NumberFormat('ja-JP',{notation:coins>=1e6?'compact':'standard',maximumFractionDigits:coins>=1e6?1:0}).format(Math.floor(coins))+' '+currency;for(const node of nodes){const button=buttons.get(node.id),taken=owned.includes(node.id),unlocked=node.requires.every(id=>owned.includes(id));button.dataset.state=taken?'owned':unlocked?'available':'locked';button.classList.toggle('selected',node.id===selected);button.setAttribute('aria-pressed',String(selected===node.id));button.querySelector('small').textContent=taken?'取得済み':node.cost.toLocaleString('ja-JP')+' '+(currency==='魂片'?'✧':'◇');}
  for(const {line,id,parent} of links)line.classList.toggle('active',owned.includes(parent)&&owned.includes(id));
  const node=nodes.find(n=>n.id===selected);dialog.querySelector('[data-node-name]').textContent=node.name;dialog.querySelector('[data-node-description]').textContent=node.description;const missing=node.requires.filter(id=>!owned.includes(id));dialog.querySelector('[data-node-requires]').textContent=missing.length?'必要：'+missing.map(id=>nodes.find(n=>n.id===id).name).join('・'):'';const buy=dialog.querySelector('[data-node-buy]');buy.disabled=!canBuy(node.id,owned,coins);buy.textContent=owned.includes(node.id)?'取得済み':missing.length?'前提の強化が必要':`${node.cost.toLocaleString('ja-JP')} ${currency}で取得`;
 }
 function startGesture(){const pts=[...pointers.values()];gesture={pts,offset:{...offset},scale};}
 map.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;map.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;startGesture();});
 map.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const pts=[...pointers.values()];if(pts.length===1&&gesture.pts.length===1){const dx=pts[0].x-gesture.pts[0].x,dy=pts[0].y-gesture.pts[0].y;if(Math.hypot(dx,dy)>6)moved=true;offset={x:gesture.offset.x+dx,y:gesture.offset.y+dy};}else if(pts.length>=2&&gesture.pts.length>=2){moved=true;const next=pinchTransform({scale:gesture.scale,offset:gesture.offset,points:gesture.pts},pts,map.getBoundingClientRect());scale=next.scale;offset=next.offset;}transform();});
 function endPointer(e){pointers.delete(e.pointerId);if(pointers.size)startGesture();else gesture=null;}
 map.addEventListener('keydown',()=>{moved=false;});
 map.addEventListener('pointerup',endPointer);map.addEventListener('pointercancel',endPointer);
 // Pointer capture retargets clicks to the map, so resolve a tap by hit testing.
 map.addEventListener('click',e=>{if(moved)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.network-node');if(target){selected=nodes.find(n=>buttons.get(n.id)===target).id;refresh();}});
 map.addEventListener('wheel',e=>{e.preventDefault();const rect=map.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,old=scale;scale=clamp(scale*Math.exp(-e.deltaY*.002),.68,1.8);offset={x:x-(x-offset.x)*scale/old,y:y-(y-offset.y)*scale/old};transform();},{passive:false});
 dialog.querySelector('[data-node-buy]').addEventListener('click',()=>{onBuy(selected);refresh();});
 const close=()=>dialog.close();dialog.querySelector('[data-close]').addEventListener('click',close);dialog.addEventListener('close',()=>{pointers.clear();onClose();});
 const resize=new ResizeObserver(()=>{if(dialog.open)transform();});resize.observe(map);
 return {open(){if(!onOpen())return;selected=nodes[0].id;refresh();dialog.showModal();scale=Math.max(.68,Math.min(1,map.clientWidth/420));offset={x:16,y:0};transform();},refresh,dispose(){resize.disconnect();dialog.remove();}};
}
