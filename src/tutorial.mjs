import {MATERIALS} from './collision.mjs?v=13';
export const TUTORIAL_KEY='cannon-castle-tutorial-v1';
export const STEPS=Object.freeze([
 {id:'stone',selector:'[data-cargo="stone"]',title:'弾を準備する',text:'石弾の数を10にしてください。ここで持ち込む数を決めます。',event:'cargo-stone'},
 {id:'repair',selector:'[data-cargo="repair"]',title:'修理をひとつ',text:'修理キットを1にしてください。灰の器の上限内なら持ち込めます。',event:'cargo-repair'},
 {id:'depart',selector:'[data-start]',title:'準備ができたら出発',text:'「過去へ旅立つ」をタップ。練習中は敵の攻撃で倒れません。',event:'depart'},
 {id:'wall',title:'城壁をタップ',text:'指の輪が示す城壁を1回タップ。押し続ける必要はありません。弾が当たって壁が壊れるのを待ちましょう。',event:'wall'},
 {id:'device',title:'装置から刻印片を回収',text:'奥に現れた輪の刻印をタップ。普通の石ではなく、この装置が旅の強化に使う刻印片を持っています。',event:'device'},
 {id:'power',selector:'[data-buy="power"]',title:'刻印片で威力を強化',text:'「威力」をタップして購入。旅の間だけ砲撃が強くなります。',event:'power'},
 {id:'barracks',title:'反撃を止める',text:'指の輪が示す兵舎をタップ。壊すと新しい兵士が現れなくなります。練習中の攻撃は無害です。',event:'barracks'},
 {id:'core',title:'城の核を解放する',text:'中央の大きな刻印をタップ。核から得る魂片は、帰還すると恒久強化に使えます。',event:'clear'},
 {id:'loot',selector:'.loot-dialog[open] .loot-cards',title:'恩恵と代償を選ぶ',text:'3つから好きな遺物を1つ選んでタップ。良い効果と代償があります。選ぶと自動で次の城へ進みます。',event:'relic'},
 {id:'return',selector:'[data-return]',title:'魂片を持って帰る',text:'「帰還」をタップ。旅の強化は消えますが、魂片は祭壇へ持ち帰れます。',event:'return'},
 {id:'altar',selector:'[data-altar]',title:'次の旅へ力を残す',text:'「魂の祭壇で恒久強化」をタップしてください。',event:'altar'},
 {id:'permanent',selector:'.network-dialog[open] [data-node-buy]',title:'恒久強化を取得',text:'「頑丈な砲台」の取得ボタンをタップ。実際の旅では、この強化が次の旅にも残ります。',event:'permanent'}
]);
export function advanceTutorial(index,event){return STEPS[index]?.event===event?index+1:index;}
export function practiceDamageAllowed(block,step){return step==='wall'?block.practiceTarget==='wall':step==='device'?block.role==='device':step==='barracks'?block.role==='barracks':step==='core'?block.role==='core':false;}
export function practiceBlueprint(){
 const entries=[[-3,0,-2.5,'wall'],[-3,0,-5.5,'device'],[3,0,-3.5,'barracks'],[0,0,-7,'core']];
 const blocks=entries.map(([x,r,z,target],i)=>({key:'practice:'+i,x,y:r*.79+.4,z,kind:'brick',tone:'slate',material:'wood',maxHP:30,mass:MATERIALS.wood.mass,buildingId:'practice:'+target,role:target==='wall'?undefined:target,deviceId:target==='device'?'front':target==='barracks'?'barracks':undefined,practiceTarget:target}));
 return {type:{id:'practice',name:'練習の城'},blocks,flags:[],maxHeight:2};
}
export function readTutorial(storage){try{const value=JSON.parse(storage?.getItem(TUTORIAL_KEY)||'null');if(!value||value.version!==1||!['welcome','active','complete','skipped'].includes(value.status)||!Number.isInteger(value.index)||value.index<0||value.index>=STEPS.length)return null;return value;}catch{return null;}}
export function placeCard(target,width,height,cardWidth,cardHeight){
 const gap=14,pad=10,candidates=[{left:(width-cardWidth)/2,top:target.bottom+gap},{left:(width-cardWidth)/2,top:target.top-cardHeight-gap},{left:target.right+gap,top:(height-cardHeight)/2},{left:target.left-cardWidth-gap,top:(height-cardHeight)/2}];
 const inside=p=>p.left>=pad&&p.top>=pad&&p.left+cardWidth<=width-pad&&p.top+cardHeight<=height-pad;
 return candidates.find(inside)||{left:pad,top:Math.max(pad,height-cardHeight-pad)};
}
export function createTutorial({root,storage,hasProgress,getPractice,onStart,onExit,getPoint}){
 let saved=readTutorial(storage),active=false,open=false,index=saved?.index||0,lastTarget=null,raf=0,disposed=false;
 const host=document.createElement('div');host.className='tutorial-layer';host.hidden=true;
 host.innerHTML='<div class="tutorial-mask"></div>'.repeat(4)+'<div class="tutorial-focus"><span class="tutorial-finger" aria-hidden="true">☝</span></div><section class="tutorial-card" role="region" aria-label="操作ガイド"><small data-tutorial-counter></small><h2></h2><p id="tutorial-instruction" aria-live="polite"></p><div class="tutorial-buttons"><button type="button" data-guide-locate>↓ 対象へ移動</button><button type="button" data-guide-begin>安全な練習を始める</button><button type="button" data-guide-skip>スキップ</button></div></section>';
 document.body.append(host);
 const card=host.querySelector('.tutorial-card'),focus=host.querySelector('.tutorial-focus'),masks=[...host.querySelectorAll('.tutorial-mask')],begin=host.querySelector('[data-guide-begin]'),locate=host.querySelector('[data-guide-locate]'),skip=host.querySelector('[data-guide-skip]');
 function write(status){saved={version:1,status,index:Math.min(index,STEPS.length-1),practice:active?getPractice():null};try{storage?.setItem(TUTORIAL_KEY,JSON.stringify(saved));}catch{}}
 function target(){return active?(STEPS[index].selector?root.querySelector(STEPS[index].selector):null):null;}
 function rect(){const element=target();if(element)return element.getBoundingClientRect();const point=active?getPoint(STEPS[index].id):null;if(point)return {left:point.x-26,right:point.x+26,top:point.y-26,bottom:point.y+26,width:52,height:52};return null;}
 function moveTo(){const element=target();element?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});element?.focus({preventScroll:true});}
 const setText=(element,value)=>{if(element.textContent!==value)element.textContent=value;};
 function paint(){if(!open||disposed)return;
  const dialog=root.querySelector('dialog[open]'),parent=dialog||document.body;if(host.parentNode!==parent)parent.append(host);
  const step=STEPS[index],vv=visualViewport,w=vv?.width||innerWidth,h=vv?.height||innerHeight,offset=vv?.offsetTop||0;
  const r=rect(),visible=r&&r.bottom>offset+8&&r.top<offset+h-8&&r.right>0&&r.left<w;
  const local=r?{left:r.left,right:r.right,top:r.top-offset,bottom:r.bottom-offset,width:r.width,height:r.height}:null;
  const offscreen=active&&!visible;begin.hidden=active;locate.hidden=!offscreen||!target();focus.hidden=!active||!visible;
  const resume=saved?.status==='active';begin.textContent=resume?'練習の続きから':'安全な練習を始める';
  setText(host.querySelector('h2'),active?step.title:'城の核を解放し、未来へ力を持ち帰ろう');
  setText(host.querySelector('p'),active?step.text+(offscreen?' 画面外にあります。矢印の方向へスクロールしてください。':''):'弾の準備から砲撃、帰還と恒久強化まで、ひとつずつ操作して覚えます。練習の報酬や消費は本来のセーブに残りません。');
  setText(host.querySelector('[data-tutorial-counter]'),active?`安全な練習 · ${index+1} / ${STEPS.length} · 報酬は練習専用`:'操作ガイド · 約2分');
  skip.textContent=active?'練習を終える':'今はスキップ';
  const set=(el,x,y,width,height)=>Object.assign(el.style,{left:x+'px',top:(y+offset)+'px',width:Math.max(0,width)+'px',height:Math.max(0,height)+'px'});
  if(active&&visible){const left=Math.max(0,local.left-5),right=Math.min(w,local.right+5),top=Math.max(0,local.top-5),bottom=Math.min(h,local.bottom+5);set(focus,left,top,right-left,bottom-top);set(masks[0],0,0,w,top);set(masks[1],0,bottom,w,h-bottom);set(masks[2],0,top,left,bottom-top);set(masks[3],right,top,w-right,bottom-top);}
  else{set(masks[0],0,0,w,h);for(let i=1;i<4;i++)set(masks[i],0,0,0,0);}
  card.style.width=Math.min(300,w-20)+'px';const size=card.getBoundingClientRect(),pos=active&&visible?placeCard(local,w,h,size.width,size.height):{left:(w-size.width)/2,top:Math.max(8,(h-size.height)/2)};
  const safe=getComputedStyle(host),safeTop=parseFloat(safe.getPropertyValue('--guide-safe-top'))||0,safeBottom=parseFloat(safe.getPropertyValue('--guide-safe-bottom'))||0;card.style.left=pos.left+'px';card.style.top=(Math.max(safeTop+8,Math.min(h-safeBottom-size.height-8,pos.top))+offset)+'px';
  if(offscreen&&r)locate.textContent=r.top>h+offset?'↓ 下の対象へ移動':'↑ 上の対象へ移動';
  const element=target();if(element!==lastTarget){lastTarget?.removeAttribute('aria-describedby');element?.setAttribute('aria-describedby','tutorial-instruction');element?.focus({preventScroll:true});lastTarget=element;}
 }
 const block=e=>{if(!open||host.contains(e.target))return;if(!active){e.preventDefault();e.stopImmediatePropagation();return;}const el=target(),canvas=!STEPS[index].selector&&e.target===root.querySelector('canvas');if((el&&(el===e.target||el.contains(e.target)))||canvas)return;e.preventDefault();e.stopImmediatePropagation();};
 root.addEventListener('click',block,true);root.addEventListener('pointerdown',block,true);
 function loop(){if(!root.isConnected){dispose();return;}paint();raf=requestAnimationFrame(loop);}
 function show(){if(active)return;open=true;host.hidden=false;paint();begin.focus({preventScroll:true});}
 begin.addEventListener('click',()=>{active=true;index=saved?.status==='active'?saved.index:0;index=onStart(saved?.status==='active'?saved.practice:null,index)??index;write('active');paint();moveTo();});
 skip.addEventListener('click',()=>finish(false));locate.addEventListener('click',moveTo);
 function finish(complete){const wasActive=active;active=false;open=false;host.hidden=true;lastTarget?.removeAttribute('aria-describedby');lastTarget=null;write(complete?'complete':'skipped');onExit(wasActive,complete);}
 function event(name){if(!active)return;const next=advanceTutorial(index,name);if(next===index)return;index=next;if(index===STEPS.length){finish(true);return;}write('active');paint();moveTo();}
 function dispose(){disposed=true;cancelAnimationFrame(raf);lastTarget?.removeAttribute('aria-describedby');root.removeEventListener('click',block,true);root.removeEventListener('pointerdown',block,true);host.remove();}
 const checkpoint=()=>{if(active)write('active');};
 raf=requestAnimationFrame(loop);
 return {show,event,checkpoint,dispose,rewind(id){const next=STEPS.findIndex(s=>s.id===id);if(active&&next>=0){index=next;write('active');paint();moveTo();}},get active(){return active;},get isOpen(){return open;},get step(){return active?STEPS[index].id:null;},get needsWelcome(){return !hasProgress&&!saved||saved?.status==='active';},get combat(){return active&&['wall','device','barracks','core'].includes(STEPS[index].id);}};
}
