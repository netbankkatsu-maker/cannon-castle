import {createFeedback} from './feedback.mjs?v=10';
import {createNetwork} from './network.mjs?v=10';
import {effects,purchaseUpgrade,stageScale,rewardForDamage,shouldAutoAdvance} from './progression.mjs?v=10';
import {loadJourney,writeJourney} from './journey-save.mjs?v=10';
import {ALTAR_UPGRADES,altarEffects,canBuyAltar,buyAltar,CARGO_TYPES,defaultLoadout,cargoWeight,validLoadout,startJourney,spendInventory,takeHit,useRepair,soulReward} from './expedition.mjs?v=10';
import {createEnemies} from './enemies.mjs?v=10';
import {drawRelics,relicEffects} from './relics.mjs?v=10';
import {createStory} from './story.mjs?v=10';
import {RELICS} from './relics.mjs?v=10';
import {drawThreat,getThreat} from './threats.mjs?v=10';
import {createLoot} from './loot.mjs?v=10';
import {createContactGate,collisionDamage,consumeSpecial,createChain,MATERIALS} from './collision.mjs?v=10';
import {castleBlueprint} from './castles.mjs?v=10';
import {turretPrice,availableCells,canPlaceTurret,reloadProgress,velocityToTarget} from './turrets.mjs?v=10';
import {SoftwareRenderer} from './software-renderer.mjs?v=10';
import {assemblyProgress} from './assembly.mjs?v=10';
import {BLOCK_HP, damageBlock, destructionPercent, blastDamage, shouldCompleteCastle, shapeDestructionPercent} from './damage.mjs?v=10';

(async()=>{const root=document.getElementById('cannon-castle-3d'),q=s=>root.querySelector(s),view=q('.viewport');try{
const [THREE,C]=await Promise.all([import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js'),import('https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js')]);
let renderer;const probe=document.createElement('canvas');const hasGL=!!probe.getContext('webgl2');if(hasGL){try{renderer=new THREE.WebGLRenderer({canvas:probe,antialias:true,alpha:false})}catch{renderer=new SoftwareRenderer()}}else renderer=new SoftwareRenderer();renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;view.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','大砲の弾がブロックの城に当たり、崩れていく3Dゲーム');renderer.domElement.setAttribute('role','img');
const masonryTexture=new THREE.TextureLoader().load('/assets/masonry.webp');masonryTexture.colorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#3c4550');scene.fog=new THREE.Fog('#3c4550',38,85);const camera=new THREE.PerspectiveCamera(43,1,.1,120);camera.position.set(13,12,23);camera.lookAt(0,2,-2);
scene.add(new THREE.HemisphereLight(0xeaf4ee,0x534d46,2.8));const sun=new THREE.DirectionalLight(0xfff0d3,3);sun.position.set(-12,22,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18});sun.shadow.bias=-.001;scene.add(sun);
const world=new C.World({gravity:new C.Vec3(0,-16,0),allowSleep:true});world.broadphase=new C.SAPBroadphase(world);world.solver.iterations=12;const stone=new C.Material('stone');world.defaultContactMaterial.friction=.55;world.defaultContactMaterial.restitution=.08;world.addContactMaterial(new C.ContactMaterial(stone,stone,{friction:.65,restitution:.03}));const groundBody=new C.Body({mass:0,shape:new C.Plane(),material:stone});groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(groundBody);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),mat('#4d5054'));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);const platform=new THREE.Mesh(new THREE.BoxGeometry(12,.16,11),mat('#535259'));platform.position.set(0,-.065,-4.8);platform.receiveShadow=true;scene.add(platform);
const toneMaterials=Object.fromEntries(Object.entries({ivory:'#f1e4cd',rose:'#e1bdb8',blue:'#507ead',sand:'#cfad7d',slate:'#43546a',gold:'#cba34c',brick:'#b38d78',terracotta:'#b96848'}).map(([key,color])=>[key,mat(color)]));const materials=['#d8c9ad','#c9baa0','#e1d4bd','#bfae92'].map(c=>mat(c));const metal=mat('#70614c',{metalness:.65,roughness:.35}),wood=mat('#4e433a'),ballmat=mat('#303633',{metalness:.65,roughness:.28});const boxgeo=new THREE.BoxGeometry(.94,.76,.94),ballgeo=new THREE.SphereGeometry(.28,14,10),conegeo=new THREE.ConeGeometry(.65,1.8,8);
const ironMat=mat('#41404c',{metalness:.85,roughness:.28}),burstMat=mat('#bd813d',{metalness:.6,emissive:'#472611'});
const cannon=new THREE.Group();cannon.position.set(0,.65,12);scene.add(cannon);const carriage=new THREE.Mesh(new THREE.BoxGeometry(1.2,.45,1.4),wood);carriage.castShadow=true;cannon.add(carriage);for(const x of [-.8,.8]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,.2,14),metal);wheel.rotation.z=Math.PI/2;wheel.position.set(x,-.08,0);wheel.castShadow=true;cannon.add(wheel)}const mount=new THREE.Group();mount.position.y=.5;cannon.add(mount);const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.26,.4,2.3,16),metal);barrel.rotation.x=Math.PI/2;barrel.position.z=-.65;barrel.castShadow=true;mount.add(barrel);const muzzle=new THREE.Mesh(new THREE.TorusGeometry(.27,.075,8,16),metal);muzzle.position.z=-1.81;mount.add(muzzle);
const actorTexture=new THREE.TextureLoader().load('/assets/ash-wanderer.webp');actorTexture.colorSpace=THREE.SRGBColorSpace;const actor=new THREE.Sprite(new THREE.SpriteMaterial({map:actorTexture,transparent:true,depthWrite:false}));actor.position.set(-1.7,1,11.5);actor.scale.set(1.2,1.8,1);scene.add(actor);
const ring=new THREE.Mesh(new THREE.TorusGeometry(.35,.035,8,32),new THREE.MeshBasicMaterial({color:0xd7b97c,depthTest:false}));ring.renderOrder=8;scene.add(ring);const linegeo=new THREE.BufferGeometry(),trajectory=new THREE.Line(linegeo,new THREE.LineDashedMaterial({color:0x526b53,dashSize:.24,gapSize:.18,transparent:true,opacity:.65}));scene.add(trajectory);
const preview=new URLSearchParams(location.search).has('castle');
let storage;try{storage=localStorage}catch{}
const meta=(!preview&&loadJourney(storage))||{version:2,screen:preview?'battle':'home',souls:0,altarOwned:[],loadout:{...defaultLoadout},sound:true,run:null,bestDay:1,journeys:0};
const saved=meta.run;
let permanent=altarEffects(meta.altarOwned),draftLoadout={...meta.loadout},inventory={...(saved?.inventory||defaultLoadout)},selectedAmmo=saved?.selectedAmmo||'stone',cannonHP=saved?.hp??permanent.maxHP,journeySouls=saved?.journeySouls||0,relics=saved?.relics||[],pendingChoices=saved?.pendingChoices||null,relicFX=relicEffects(relics),defeated=false;let threat=saved?.threat||'quiet';
let homeResult='',storyReturnMode='home',storyPausedAt=0;
let owned=saved?.owned||[],fx=effects(owned),sound=meta.sound;
const treasureClaimed=new Set(saved?.treasureClaimed||[]),clearClaimed=new Set(saved?.clearClaimed||[]);
let saveDirty=false,saveClock=0,simTime=0,clearElapsed=0,shotQueue=[],explosions=[],impactQueue=new Map(),coordinatedTarget=null;
const bodyBlocks=new Map(),contactGate=createContactGate(),chain=createChain();
let currentDesign=castleBlueprint(1);let blocks=[],balls=[],particles=[],flags=[],total=0,coins=saved?.coins||0,stage=saved?.stage||Math.max(1,Math.min(5,Number(new URLSearchParams(location.search).get('castle'))||1)),levels=saved?.levels||{power:1,speed:1,auto:0},cooldown=0,autoClock=0,cleared=false,ready=false,recoil=0,shake=0,assembly=null,reloadDuration=1.15,mode=meta.screen==='home'?'home':'battle',cameraTween=null;const turrets=[],gridTiles=[],cameraLook=new THREE.Vector3(0,2,-2);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const aim=new THREE.Vector3(-2,1.5,-2.5),ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),baseCost={power:30,speed:40,auto:75};const costs=k=>Math.floor(baseCost[k]*Math.pow(1.65,levels[k]-(k==='auto'?0:1)));const fmt=n=>new Intl.NumberFormat('ja-JP',{notation:n>=1e6?'compact':'standard',maximumFractionDigits:n>=1e6?1:0}).format(Math.floor(n));const status=t=>q('.status').textContent=t;
const feedback=createFeedback({root,money:q('.money'),reduced,sound,onSoundChange:value=>{sound=value;persist();}});
function runSnapshot(){return {coins,stage,levels,owned,turrets:turrets.map(({x,z})=>({x,z})),auto:q('[data-auto]').checked,hp:cannonHP,maxHP:permanent.maxHP,ammo:ammoCount(),ammoCapacity:permanent.ammoCapacity,carryCapacity:permanent.carryCapacity,inventory,selectedAmmo,treasureClaimed:[...treasureClaimed],clearClaimed:[...clearClaimed],journeySouls,day:stage,relics,pendingChoices,threat};}
function persist(){if(preview)return;meta.sound=sound;meta.run=meta.screen==='battle'?runSnapshot():null;writeJourney(storage,meta);saveDirty=false;}
function ammoCount(){return inventory.stone+inventory.iron+inventory.burst;}
function updateCargo(){const weight=cargoWeight(draftLoadout),valid=validLoadout(draftLoadout,permanent.carryCapacity);q('[data-cargo-weight]').textContent=`${Number.isFinite(weight)?weight:'—'} / ${permanent.carryCapacity}`;q('[data-ash-fill]').style.setProperty('--ash-level',Math.min(1,weight/permanent.carryCapacity));q('.ash-vessel').classList.toggle('overfull',weight>permanent.carryCapacity);q('.ash-vessel').setAttribute('aria-label',`灰の器 ${Number.isFinite(weight)?weight:0} / ${permanent.carryCapacity}`);q('[data-cargo-error]').textContent=weight>permanent.carryCapacity?'灰が器からあふれています':ammoCountDraft()===0?'砲弾をひとつ以上持ち込んでください':'';q('[data-start]').disabled=!ready||!valid;if(valid){meta.loadout={...draftLoadout};persist();}}
function ammoCountDraft(){return draftLoadout.stone+draftLoadout.iron+draftLoadout.burst;}
function returnHome(reason){
 if(meta.screen!=='battle'||!['battle','home'].includes(mode))return;const earned=Math.floor(journeySouls);meta.souls+=earned;meta.bestDay=Math.max(meta.bestDay,stage);meta.screen='home';meta.run=null;mode='home';cameraTween=null;assembly=null;defeated=false;pendingChoices=null;loot.close();enemies.clear();clearGrid();clearBodies();feedback.clear();homeResult=`${reason} · ${stage}日目から帰還 · 魂片 ＋${earned}`;persist();ui();window.scrollTo(0,0);story.play('firstReturn');
}
function beginJourney(){
 const run=startJourney(meta,draftLoadout);if(!run)return;meta.loadout={...draftLoadout};meta.screen='battle';meta.journeys++;permanent=altarEffects(meta.altarOwned);coins=run.coins;stage=1;threat=run.threat;levels=run.levels;owned=[];fx=effects(owned);inventory=run.inventory;selectedAmmo=run.selectedAmmo;cannonHP=run.hp;journeySouls=0;relics=[];pendingChoices=null;relicFX=relicEffects(relics);treasureClaimed.clear();clearClaimed.clear();for(const t of turrets)scene.remove(t.group);turrets.length=0;mode='battle';defeated=false;cooldown=0;autoClock=0;cameraTween=null;assembly=null;cannon.scale.setScalar(1);q('[data-auto]').checked=false;feedback.clear();status('');build(true);persist();ui();window.scrollTo(0,0);renderer.render(scene,camera);story.play('departureFirst');
}
const enemies=createEnemies({THREE,scene,reduced,onHit:damage=>{if(mode!=='battle'||cleared||assembly)return;const hit=takeHit(cannonHP,damage*relicFX.incoming);cannonHP=hit.hp;defeated=hit.defeated;shake=reduced?0:.15;saveDirty=true;ui();},onDefeat:position=>{journeySouls+=.4*permanent.rewardMultiplier*relicFX.souls;puff(position,'#b58ea4',5);saveDirty=true;}});
const fade=document.createElement('div');fade.className='stage-fade';fade.setAttribute('aria-hidden','true');document.body.append(fade);
const loot=createLoot({root,onChoose:id=>{
 if(mode!=='loot'||!pendingChoices?.includes(id))return;relics.push(id);relicFX=relicEffects(relics);pendingChoices=null;loot.close();mode='transition';stage=Math.min(10000,stage+1);threat=drawThreat(stage);persist();fade.classList.add('active');
 const delay=reduced?0:320;
 setTimeout(()=>{if(meta.screen!=='battle')return;cooldown=0;autoClock=0;build(true);persist();setTimeout(()=>{fade.classList.remove('active');mode='battle';ui();story.play('day'+stage);},delay);},delay);
}});
const story=createStory({root,getSeen:()=>meta.storySeen||[],onSeen:id=>{meta.storySeen||=[];if(!meta.storySeen.includes(id))meta.storySeen.push(id);persist();},onPause:()=>{storyReturnMode=mode;storyPausedAt=performance.now();mode='story';ui();},onResume:()=>{if(assembly)assembly.startedAt+=performance.now()-storyPausedAt;mode=meta.screen==='home'?'home':storyReturnMode==='loot'?'loot':'battle';ui();if(mode==='loot'&&pendingChoices)loot.open(pendingChoices);}});
const altar=createNetwork({root,nodes:ALTAR_UPGRADES,title:'魂の祭壇 · 恒久強化',currency:'魂片',canBuy:canBuyAltar,getState:()=>({owned:meta.altarOwned,coins:meta.souls}),onOpen:()=>{if(!ready||meta.screen!=='home')return false;mode='altar';return true;},onClose:()=>{mode='home';ui();if(meta.altarOwned.length)story.play('altarFirst');},onBuy:id=>{if(mode!=='altar')return;const result=buyAltar(id,meta.altarOwned,meta.souls);if(!result)return;meta.souls=result.souls;meta.altarOwned=result.owned;permanent=altarEffects(meta.altarOwned);persist();ui();updateCargo();}});
q('[data-altar]').addEventListener('click',()=>altar.open());q('[data-start]').addEventListener('click',beginJourney);q('[data-return]').addEventListener('click',()=>returnHome('旅を終えた'));
for(const type of CARGO_TYPES){const input=q('[data-cargo="'+type.id+'"]');input.value=draftLoadout[type.id];input.addEventListener('input',()=>{draftLoadout[type.id]=input.value===''?0:Number(input.value);updateCargo();});}
for(const button of root.querySelectorAll('[data-ammo]'))button.addEventListener('click',()=>{const type=button.dataset.ammo;if(mode!=='battle'||!inventory[type])return;selectedAmmo=type;persist();ui();});
q('[data-repair]').addEventListener('click',()=>{if(mode!=='battle'||assembly)return;const repaired=useRepair(cannonHP,permanent.maxHP,inventory);if(!repaired)return;cannonHP=repaired.hp;inventory=repaired.inventory;persist();ui();});
function screenPoint(position){const projected=position.clone().project(camera),rect=renderer.domElement.getBoundingClientRect();return {x:rect.left+Math.max(0,Math.min(1,(projected.x+1)/2))*rect.width,y:rect.top+Math.max(0,Math.min(1,(1-projected.y)/2))*rect.height};}
function earn(amount,position,big=false){if(!(amount>0))return;coins+=amount*relicFX.coins*getThreat(threat).coinMultiplier;saveDirty=true;feedback.reward({...screenPoint(position),amount,big,chain:chain.count});}
function registerCollapse(b){if(b.chainCounted)return;b.chainCounted=true;feedback.chain(chain.hit(b.key,simTime));}
const network=createNetwork({root,title:'旅の強化網',getState:()=>({owned,coins}),onOpen:()=>{if(!ready||assembly||mode!=='battle'||cleared)return false;mode='network';feedback.clear();ui();return true;},onClose:()=>{mode='battle';ui();},onBuy:id=>{if(mode!=='network')return;const result=purchaseUpgrade(id,owned,coins);if(!result)return;coins=result.coins;owned=result.owned;fx=effects(owned);cannon.scale.setScalar(fx.large?1.12:1);for(const turret of turrets)turret.group.scale.copy(cannon.scale);persist();ui();}});
q('[data-network]').addEventListener('click',()=>network.open());
q('[data-auto]').checked=saved?.auto||false;
q('[data-auto]').addEventListener('change',()=>{clearElapsed=0;persist();});
window.addEventListener('pagehide',persist);
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
function ui(){
 const home=meta.screen==='home';root.classList.toggle('at-home',home);q('[data-home]').hidden=!home;q('.money').setAttribute('aria-label',home?'魂片':'所持コイン');q('.coin-icon').textContent=home?'✧':'●';q('[data-currency-label]').textContent=home?'魂片':'コイン';
 q('[data-home-result]').textContent=homeResult;q('[data-relics]').textContent=relics.length?`遺物 ${relics.length} · 威力×${relicFX.power.toFixed(1)} / 装填×${relicFX.reload.toFixed(1)}`:'';q('[data-relics]').title=relics.map(id=>{const r=RELICS.find(r=>r.id===id);return r.name+'：'+r.benefit+' / '+r.drawback;}).join('\n');q('[data-home-record]').textContent=`最深到達 ${meta.bestDay}日目 · 遠征 ${meta.journeys}回`;
 if(home){q('[data-coins]').textContent=fmt(meta.souls);q('[data-cargo-weight]').textContent=`${cargoWeight(draftLoadout)} / ${permanent.carryCapacity}`;q('[data-start]').disabled=!ready||!validLoadout(draftLoadout,permanent.carryCapacity);return;}
 q('[data-cannon-hp]').style.setProperty('--hp',Math.max(0,cannonHP/permanent.maxHP*100)+'%');q('[data-cannon-hp]').textContent=`主砲HP ${Math.ceil(cannonHP)} / ${permanent.maxHP}`;q('[data-cannon-hp]').classList.toggle('danger',cannonHP<permanent.maxHP*.3);q('[data-threat]').textContent=getThreat(threat).description;q('[data-ammo-total]').textContent=`残り ${ammoCount()}発`;
 for(const b of root.querySelectorAll('[data-ammo]')){b.textContent=CARGO_TYPES.find(t=>t.id===b.dataset.ammo).name+' '+inventory[b.dataset.ammo];b.disabled=!inventory[b.dataset.ammo]||!!assembly||mode!=='battle';b.setAttribute('aria-pressed',String(selectedAmmo===b.dataset.ammo));}
 q('[data-repair]').hidden=!inventory.repair;q('[data-repair]').textContent=`修理 ${inventory.repair}`;q('[data-repair]').disabled=cannonHP>=permanent.maxHP||!!assembly||mode!=='battle';q('[data-return]').disabled=mode!=='battle'||!!assembly;q('[data-return]').classList.toggle('ammo-empty',ammoCount()===0);
q('[data-network]').disabled=!ready||!!assembly||mode!=='battle'||cleared;const busy=!!assembly||mode!=='battle';q('[data-coins]').textContent=fmt(coins);q('[data-stage]').textContent=stage+'日目 · '+currentDesign.type.name;q('[data-destroyed]').textContent='破壊率 '+(cleared?100:shapeDestructionPercent(blocks))+'%';q('.next').disabled=!cleared||busy;q('.next').hidden=true;q('[data-rebuild]').disabled=!ready||busy;q('[data-rebuild]').hidden=mode!=='battle'||(!assembly&&destructionPercent(blocks)<.1);q('.hint').textContent=assembly?'再生中…':ammoCount()?'タッチで砲撃':'弾切れ · 帰還して準備';q('.hint').hidden=cooldown>0||mode!=='battle'||cleared;for(const k of Object.keys(levels)){q('[data-level="'+k+'"]').textContent=levels[k];q('[data-price="'+k+'"]').textContent=fmt(costs(k))+' コイン';q('[data-buy="'+k+'"]').disabled=!ready||busy||coins<costs(k)}q('[data-auto]').disabled=!levels.auto||busy;q('[data-auto]').closest('label').hidden=!levels.auto||mode!=='battle';q('.fire').disabled=!ready||busy||cooldown>0||ammoCount()<=0;q('[data-add-turret]').disabled=!ready||busy||coins<turretPrice(turrets.length)||!availableCells(turrets).length;q('[data-turret-price]').textContent=fmt(turretPrice(turrets.length));q('[data-placement]').hidden=!['entering','placement','leaving'].includes(mode);q('[data-cancel-placement]').disabled=mode==='leaving';reloadUI()}
function reloadUI(){const meter=q('[data-reload]');meter.hidden=cooldown<=0||!!assembly||mode!=='battle';const progress=reloadProgress(cooldown,reloadDuration);q('[data-reload-fill]').style.width=progress+'%';q('[data-reload-text]').textContent=cooldown.toFixed(1)+' 秒';meter.setAttribute('aria-valuenow',Math.round(progress));meter.setAttribute('aria-valuetext','リロード 残り'+cooldown.toFixed(1)+'秒')}

function block(design){
 const {x,y,z,key,tone,kind,material,mass,buildingId,role}=design;
 const base=role==='powder'?mat('#aa4936'):role==='treasure'?toneMaterials.gold.clone():kind==='cone'?toneMaterials[tone].clone():mat(MATERIALS[material].color);
 if(material!=='wood')base.map=masonryTexture;if(role==='treasure'){base.emissive.set('#75612f');base.emissiveIntensity=.25;}if(role==='powder'){base.emissive.set('#7b3a1e');base.emissiveIntensity=.15;}
 if(!role&&toneMaterials[tone])base.color.lerp(toneMaterials[tone].color,.45);
 const m=new THREE.Mesh(kind==='cone'?conegeo:boxgeo,base);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);
 const shape=kind==='cone'?new C.Cylinder(.03,.65,1.8,8):new C.Box(new C.Vec3(.47,.38,.47));
 const body=new C.Body({mass,shape,material:stone,position:new C.Vec3(x,y,z),linearDamping:.18,angularDamping:.3,sleepSpeedLimit:.15,sleepTimeLimit:.6});world.addBody(body);
 const maxHP=design.maxHP*stageScale(stage).hp*getThreat(threat).hpMultiplier,b={key,mesh:m,body,origin:new THREE.Vector3(x,y,z),maxHP,hp:maxHP,material,buildingId,role,collapsed:false,supports:[],color:base.color.clone()};
 blocks.push(b);bodyBlocks.set(body.id,b);
 body.addEventListener('collide',event=>{
  const other=bodyBlocks.get(event.body.id);if(!other&&event.body!==groundBody)return;
  const speed=Math.abs(event.contact.getImpactVelocityAlongNormal());
  if(speed<2.5||!contactGate.accept(body.id,event.body.id,simTime))return;
  const multiplier=(fx.collapse?1.75:1)*stageScale(stage).hp;
  const queue=(target,value)=>impactQueue.set(target,Math.max(impactQueue.get(target)||0,value));
  queue(b,collisionDamage(other?.body.mass||body.mass,speed,multiplier));
  if(other)queue(other,collisionDamage(body.mass,speed,multiplier));
 });
}
function castleFlags(keys){for(const key of keys){const topBlock=blocks.find(b=>b.key===key);if(!topBlock)continue;const mast=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.3,6),metal);pole.position.y=.98;pole.castShadow=true;mast.add(pole);const flag=new THREE.Mesh(new THREE.BoxGeometry(.65,.4,.025),mat(stage%2?'#bc7055':'#598894'));flag.position.set(.32,1.42,0);flag.castShadow=true;mast.add(flag);topBlock.mesh.add(mast);flags.push({mesh:mast,parent:topBlock,body:null})}}
function connectSupports(){for(const b of blocks){if(b.origin.y<.5)continue;let candidates=blocks.filter(other=>other!==b&&other.origin.y<b.origin.y-.2&&Math.hypot(other.origin.x-b.origin.x,other.origin.z-b.origin.z)<.1);if(!candidates.length)candidates=blocks.filter(other=>other!==b&&other.origin.y<b.origin.y-.2&&Math.hypot(other.origin.x-b.origin.x,other.origin.z-b.origin.z)<=1.05);if(candidates.length){const highest=Math.max(...candidates.map(other=>other.origin.y));b.supports=candidates.filter(other=>other.origin.y>=highest-.1)}}}

function clearBodies(){
 pendingRemoval.clear();bodyBlocks.clear();contactGate.clear();impactQueue.clear();explosions=[];shotQueue=[];chain.clear();coordinatedTarget=null;
 for(const b of blocks){world.removeBody(b.body);scene.remove(b.mesh);b.mesh.material.dispose();if(b.crack){b.crack.geometry.dispose();b.crack.material.dispose();}}
 for(const b of balls){world.removeBody(b.body);scene.remove(b.mesh);}
 for(const p of particles){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();}
 for(const f of flags){if(f.body&&f.body.world===world)world.removeBody(f.body);f.mesh.removeFromParent();f.mesh.traverse(m=>{if(m.isMesh){m.geometry.dispose();if(m.material!==metal)m.material.dispose();}});}
 blocks=[];balls=[];particles=[];flags=[];
}
function build(animate=false){const old=animate?blocks.map(b=>({position:b.mesh.position.clone(),quaternion:b.mesh.quaternion.clone()})):[];clearBodies();clearElapsed=0;cleared=false;currentDesign=castleBlueprint(stage);for(const design of currentDesign.blocks)block(design);connectSupports();castleFlags(currentDesign.flags);total=blocks.length;for(const b of blocks)b.body.sleep();if(animate){assembly={elapsed:0,startedAt:performance.now(),entries:blocks.map((b,i)=>{const target=new THREE.Vector3(b.body.position.x,b.body.position.y,b.body.position.z),rotation=new THREE.Quaternion(b.body.quaternion.x,b.body.quaternion.y,b.body.quaternion.z,b.body.quaternion.w);const previous=old[i];const start=previous?previous.position.clone():new THREE.Vector3((Math.random()-.5)*13,.4,-4+(Math.random()-.5)*9);start.x=Math.max(-10,Math.min(10,start.x));start.z=Math.max(-13,Math.min(2,start.z));start.y=Math.max(.4,start.y);b.mesh.position.copy(start);b.mesh.quaternion.copy(previous?previous.quaternion:new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()*3,Math.random()*3,Math.random()*3)));return {mesh:b.mesh,start,target,startRotation:b.mesh.quaternion.clone(),rotation}})};for(const f of flags)f.mesh.visible=false;ring.visible=false;trajectory.visible=false;status('再生中…')}enemies.reset(stage,blocks,getThreat(threat));aim.set(-2,1.5,-2.5);aimUpdate();ui()}
const origin=()=>new THREE.Vector3(0,1.3,11);function launchVelocity(){const v=velocityToTarget(origin(),aim);return new THREE.Vector3(v.x,v.y,v.z)}function aimUpdate(){const v=launchVelocity(),dir=v.clone().normalize();mount.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),dir);ring.position.copy(aim);const points=[],o=origin();for(let i=0;i<=30;i++){const t=i*.028;points.push(new THREE.Vector3(o.x+v.x*t,o.y+v.y*t-8*t*t,o.z+v.z*t))}linegeo.setFromPoints(points);trajectory.computeLineDistances()}
function puff(position,color,count=10){for(let i=0;i<count&&particles.length<180;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.08+Math.random()*.1,0),mat(color,{transparent:true}));m.position.copy(position);scene.add(m);particles.push({mesh:m,v:new THREE.Vector3((Math.random()-.5)*6,Math.random()*5+2,(Math.random()-.5)*6),life:.7+Math.random()*.4})}}
function detachFlag(block){for(const f of flags){if(f.parent!==block||f.body)continue;block.mesh.updateWorldMatrix(true,true);scene.attach(f.mesh);const p=f.mesh.position,qf=f.mesh.quaternion,offset=new THREE.Vector3(0,.82,0).applyQuaternion(qf);f.body=new C.Body({mass:.12,shape:new C.Box(new C.Vec3(.33,.83,.04)),position:new C.Vec3(p.x+offset.x,p.y+offset.y,p.z+offset.z),material:stone,linearDamping:.35,angularDamping:.45});f.body.quaternion.set(qf.x,qf.y,qf.z,qf.w);f.body.velocity.copy(block.body.velocity);f.body.angularVelocity.copy(block.body.angularVelocity);f.body.angularVelocity.z+=1.5;world.addBody(f.body)}}
function updateFlags(){const offset=new C.Vec3(0,.82,0);for(const f of flags){if(f.body){const rotated=f.body.quaternion.vmult(offset);f.mesh.position.set(f.body.position.x-rotated.x,f.body.position.y-rotated.y,f.body.position.z-rotated.z);f.mesh.quaternion.copy(f.body.quaternion)}}}
function applyDamage(b,amount){
 if(b.hp<=0)return;
 if(fx.cracks)amount*=1+(1-b.hp/b.maxHP)*.5;
 const dealt=damageBlock(b,amount);journeySouls+=soulReward(dealt,b.maxHP,stage)*permanent.rewardMultiplier*relicFX.souls;
 earn(rewardForDamage(b,dealt,stage)*(fx.chain?1+Math.min(20,chain.count)*.025:1),b.mesh.position);
 const remaining=b.hp/b.maxHP;b.mesh.material.color.copy(b.color).multiplyScalar(.55+.45*remaining);
 if(remaining<.6&&!b.crack){
  const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.28,.28,.475),new THREE.Vector3(.03,.06,.475),new THREE.Vector3(-.08,-.1,.475),new THREE.Vector3(.28,-.27,.475)]);
  b.crack=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#4b3425'}));b.mesh.add(b.crack);
 }
 if(b.hp===0){
  registerCollapse(b);detachFlag(b);scene.remove(b.mesh);pendingRemoval.add(b.body);puff(b.mesh.position,'#c7b897',3);
  const special=consumeSpecial(b,treasureClaimed,stage);
  if(special==='powder'){explosions.push({position:b.mesh.position.clone(),powder:true});puff(b.mesh.position,'#ed9b43',24);}
  if(special==='treasure')earn((80+stage*20)*stageScale(stage).reward*(fx.treasure?2:1),b.mesh.position,true);
 }
}
const pendingRemoval=new Set();
function blast(p,powder=false,hit=null,type='stone'){
 const radius=(1.55+levels.power*.32)*relicFX.radius*(type==='burst'?1.55:1)*(fx.blast?1.3:1)*(powder?(fx.ignite?1.8:1.4):1);
 for(const b of blocks){if(b.hp<=0)continue;
  const dx=b.body.position.x-p.x,dy=b.body.position.y-p.y,dz=b.body.position.z-p.z,d=Math.hypot(dx,dy,dz);
  if(fx.fragments&&d>=radius&&d<radius+1.5){applyDamage(b,(18+levels.power*4)*(1-(d-radius)/1.5));puff(b.mesh.position,'#bba78b',2);}
  if(d<radius){
   let amount=blastDamage(d,radius,levels.power)*(fx.advance?1.15:1)*permanent.powerMultiplier*relicFX.power*(type==='iron'?1.6:type==='burst'?1.2:1)*(fx.fragments?1.3:1)*(powder?(fx.ignite?1.8:1.2):1);
   if(fx.chain)amount*=1+Math.min(20,chain.count)*.02;
   if(b===hit)amount*=(fx.impact?1.5:1)*(fx.focus?1.25:1);
   applyDamage(b,amount);
   const force=(1-d/radius)*(7+levels.power*2)*(type==='iron'?1.5:1)*(fx.weight?1.45:1);
   b.body.wakeUp();b.body.applyImpulse(new C.Vec3(dx/(d+.1)*force,(dy/(d+.1)*.4+.75)*force,dz/(d+.1)*force-4),new C.Vec3(0,0,0));
  }
 }
 enemies.damageAt(p,radius,(55+levels.power*25)*permanent.powerMultiplier*relicFX.power);puff(p,powder||type==='burst'?'#df9d4d':'#c7b897',18);shake=reduced?0:.16;
}
function processDamage(){
 for(const [b,damage]of impactQueue)applyDamage(b,damage);impactQueue.clear();
 // Detonations may enqueue more detonations; each store can fire only once.
 for(let i=0;i<explosions.length;i++){const event=explosions[i];blast(event.position,event.powder,event.hit,event.type);}
 explosions=[];
 for(const body of pendingRemoval){if(body.world===world)world.removeBody(body);}pendingRemoval.clear();
}
function createShot(o,target,type=selectedAmmo){
 if(balls.length>=80||meta.screen!=='battle')return;
 const spent=spendInventory(inventory,type);if(!spent)return;inventory=spent;saveDirty=true;
 if(!inventory[selectedAmmo])selectedAmmo=['stone','iron','burst'].find(id=>inventory[id]>0)||selectedAmmo;

 const v=velocityToTarget(o,target),m=new THREE.Mesh(ballgeo,type==='burst'?burstMat:type==='iron'?ironMat:ballmat);m.scale.setScalar(fx.large?1.4:1);m.position.copy(o);m.castShadow=true;scene.add(m);
 const body=new C.Body({mass:(14+levels.power*3)*(fx.weight?1.5:1),shape:new C.Sphere(fx.large?.39:.28),position:new C.Vec3(o.x,o.y,o.z),velocity:new C.Vec3(v.x,v.y,v.z),linearDamping:.01,collisionFilterGroup:2,collisionFilterMask:1,collisionResponse:!fx.pierce});world.addBody(body);
 const shot={mesh:m,body,age:0,type,hits:new Set()};
 body.addEventListener('collide',event=>{const hit=bodyBlocks.get(event.body.id);if(!hit||hit.hp<=0||shot.hits.has(hit.key)||shot.hits.size>=(fx.pierce?3:1))return;shot.hits.add(hit.key);explosions.push({position:new THREE.Vector3(body.position.x,body.position.y,body.position.z),hit,type});});balls.push(shot);puff(o,'#ead19d',5);
}
function fireVolley(o,target){const type=selectedAmmo;createShot(o,target,type);if(fx.double)shotQueue.push({remaining:.12,source:o.clone(),target:target.clone(),type});}
function shoot(){if(!ready||assembly||mode!=='battle'||cleared||cooldown>0||ammoCount()<=0)return;reloadDuration=Math.max(.22,1.15*Math.pow(.8,levels.speed-1)*relicFX.reload);cooldown=reloadDuration;fireVolley(origin(),aim);recoil=.18;ui();}
function chooseTarget(){
 const targets=blocks.filter(b=>b.hp>0&&!b.collapsed);if(!targets.length)return blocks.find(b=>b.hp>0)||null;
 if(fx.coordination&&coordinatedTarget?.hp>0&&!coordinatedTarget.collapsed)return coordinatedTarget;
 let target;
 if(fx.foundation)target=targets.reduce((a,b)=>b.origin.y<a.origin.y?b:a);
 else if(fx.weak)target=targets.reduce((a,b)=>b.hp/b.maxHP<a.hp/a.maxHP?b:a);
 else target=targets[Math.floor(Math.random()*targets.length)];
 if(fx.coordination)coordinatedTarget=target;return target;
}
function nextCastle(){if(pendingChoices)loot.open(pendingChoices);}
function addTurret(cell){const group=cannon.clone(true);group.position.set(cell.x,.65,cell.z);const turretMount=group.children[3],turretBarrel=turretMount.children[0];scene.add(group);turrets.push({x:cell.x,z:cell.z,group,mount:turretMount,barrel:turretBarrel,timer:.2,recoil:0})}
const tileGeometry=new THREE.BoxGeometry(2.65,.06,2.65),tileMaterial=new THREE.MeshStandardMaterial({color:'#b4d29a',roughness:1,transparent:true,opacity:.75});
function clearGrid(){for(const tile of gridTiles)scene.remove(tile);gridTiles.length=0}
const battlePosition=()=>currentDesign.maxHeight>8?new THREE.Vector3(15,16,28):turrets.length?new THREE.Vector3(15,16,29):new THREE.Vector3(13,12,23);const battleLook=()=>currentDesign.maxHeight>8?new THREE.Vector3(0,3.5,-1):turrets.length?new THREE.Vector3(0,2,0):new THREE.Vector3(0,2,-2);
function cameraMove(enter){mode=enter?'entering':'leaving';const height=Math.max(36,29/Math.max(.65,camera.aspect));cameraTween={start:performance.now(),from:camera.position.clone(),to:enter?new THREE.Vector3(0,height,2):battlePosition(),lookFrom:cameraLook.clone(),lookTo:enter?new THREE.Vector3(0,0,2):battleLook(),upFrom:camera.up.clone(),upTo:enter?new THREE.Vector3(0,0,-1):new THREE.Vector3(0,1,0),enter};ui()}
function startPlacement(){if(!ready||assembly||mode!=='battle'||coins<turretPrice(turrets.length))return;clearGrid();for(const cell of availableCells(turrets)){const tile=new THREE.Mesh(tileGeometry,tileMaterial);tile.position.set(cell.x,.055,cell.z);tile.userData.cell=cell;gridTiles.push(tile);scene.add(tile)}ring.visible=false;trajectory.visible=false;status('');cameraMove(true)}
function leavePlacement(){if(mode==='battle'||mode==='leaving')return;clearGrid();cameraMove(false)}
function tickCamera(now){if(cameraTween){const tween=cameraTween,t=reduced?1:Math.min(1,(now-tween.start)/1100),ease=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,ease);cameraLook.lerpVectors(tween.lookFrom,tween.lookTo,ease);camera.up.lerpVectors(tween.upFrom,tween.upTo,ease).normalize();if(t>=1){mode=tween.enter?'placement':'battle';cameraTween=null;if(mode==='battle'){ring.visible=true;trajectory.visible=true}ui()}}else if(mode==='battle'){camera.position.copy(battlePosition());camera.position.x+=shake>0?(Math.random()-.5)*shake:0;camera.up.set(0,1,0);cameraLook.copy(battleLook())}camera.lookAt(cameraLook)}
q('[data-add-turret]').addEventListener('click',startPlacement);q('[data-cancel-placement]').addEventListener('click',leavePlacement);

view.addEventListener('pointerdown',e=>{if(!ready||assembly||e.target!==renderer.domElement||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);if(mode!=='battle'){if(mode!=='placement')return;const selected=ray.intersectObjects(gridTiles)[0];if(!selected)return;const cell=selected.object.userData.cell;if(!canPlaceTurret(cell,turrets,coins))return;coins-=turretPrice(turrets.length);addTurret(cell);persist();leavePlacement();return}const hits=ray.intersectObjects([...blocks.filter(b=>b.hp>0).map(b=>b.mesh),...enemies.targets],true);if(hits.length){aim.copy(hits[0].point);aimUpdate();if(cooldown>0)return;shoot()}});q('.fire').addEventListener('click',shoot);q('.next').addEventListener('click',nextCastle);q('[data-rebuild]').addEventListener('click',()=>{if(!ready||assembly||mode!=='battle')return;cooldown=0;autoClock=0;build(true)});root.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.buy,c=costs(k);if(coins<c||!ready||assembly||mode!=='battle')return;coins-=c;levels[k]++;if(k==='auto')q('[data-auto]').checked=true;status('');persist();ui()}));
cannon.scale.setScalar(fx.large?1.12:1);
for(const cell of saved?.turrets||[])addTurret(cell);
const resize=new ResizeObserver(()=>{const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(view);
renderer.setSize(view.clientWidth,view.clientHeight);camera.aspect=view.clientWidth/view.clientHeight;camera.updateProjectionMatrix();build();ready=true;q('.loading').hidden=true;ui();updateCargo();if(saved&&cannonHP<=0)returnHome('主砲が壊れた');else if(pendingChoices){cleared=true;mode='loot';enemies.clear();if(!story.play('firstClear'))loot.open(pendingChoices);ui();}else if(meta.screen==='home')story.play('intro');
let last=performance.now(),hudClock=0;
function frame(now){
 if(!root.isConnected){resize.disconnect();clearGrid();clearBodies();feedback.dispose();network.dispose();altar.dispose();loot.dispose();story.dispose();enemies.dispose();fade.remove();renderer.dispose();return;}
 const dt=Math.min((now-last)/1000,.1);last=now;feedback.tick(now);
 if(document.hidden){requestAnimationFrame(frame);return;}
 if(['network','home','altar','loot','story'].includes(mode)){requestAnimationFrame(frame);return;}
 tickCamera(now);
 if(mode!=='battle'){renderer.render(scene,camera);requestAnimationFrame(frame);return;}
 cooldown=Math.max(0,cooldown-dt);reloadUI();autoClock+=dt;
 if(assembly){assembly.elapsed=(now-assembly.startedAt)/1000;for(let i=0;i<assembly.entries.length;i++){const e=assembly.entries[i],t=assemblyProgress(assembly.elapsed,i,assembly.entries.length,reduced);e.mesh.position.lerpVectors(e.start,e.target,t);e.mesh.quaternion.slerpQuaternions(e.startRotation,e.rotation,t);}if(reduced||assembly.elapsed>=1.4){assembly=null;for(const f of flags)f.mesh.visible=true;ring.visible=true;trajectory.visible=true;status('');ui();}renderer.render(scene,camera);requestAnimationFrame(frame);return;}
 simTime+=dt;chain.expire(simTime);
 for(let i=shotQueue.length-1;i>=0;i--){const shot=shotQueue[i];shot.remaining-=dt;if(shot.remaining<=0){if(!cleared)createShot(shot.source,shot.target,shot.type);shotQueue.splice(i,1);}}
 for(const b of blocks){if(b.hp>0&&!b.collapsed&&b.supports.length&&b.supports.every(parent=>parent.hp<=0||parent.collapsed))b.body.wakeUp();}
 world.step(1/60,dt,3);
 for(const b of blocks){if(b.hp<=0)continue;b.mesh.position.copy(b.body.position);b.mesh.quaternion.copy(b.body.quaternion);
  if(Math.abs(b.mesh.position.x)>16||b.mesh.position.z<-20||b.mesh.position.z>19||b.mesh.position.y<-2){applyDamage(b,b.maxHP);continue;}
  if(!b.collapsed&&(b.mesh.position.distanceTo(b.origin)>.8||b.origin.y-b.mesh.position.y>.6||(b.origin.y>=1&&new THREE.Vector3(0,1,0).applyQuaternion(b.mesh.quaternion).y<.7))){b.collapsed=true;registerCollapse(b);applyDamage(b,b.maxHP*.6);}
 }
 processDamage();updateFlags();
 if(!cleared&&shouldCompleteCastle(blocks)){
  // Recover any exposed stores at clear so automatic progression cannot skip them.
  for(const b of blocks)if(b.role&&b.hp>0)applyDamage(b,b.hp);processDamage();
  cleared=true;clearElapsed=0;
  const bonus=clearClaimed.has(stage)?0:(50+stage*15)*stageScale(stage).reward;
  clearClaimed.add(stage);earn(bonus,new THREE.Vector3(0,2,-4),true);status('クリア！'+(bonus?' ＋'+fmt(bonus)+' コイン':''));enemies.clear();pendingChoices=drawRelics();mode='loot';persist();ui();if(!story.play('firstClear'))loot.open(pendingChoices);
 }
 if(['loot','story'].includes(mode)){renderer.render(scene,camera);requestAnimationFrame(frame);return;}
 enemies.tick(dt);if(defeated){returnHome('主砲が壊れた');requestAnimationFrame(frame);return;}
 for(let i=balls.length-1;i>=0;i--){const b=balls[i];b.age+=dt;b.mesh.position.copy(b.body.position);if(!b.hits.size&&enemies.hitTest(b.body.position,.4)){b.hits.add('enemy');explosions.push({position:b.mesh.position.clone(),type:b.type});}if(b.age>5){world.removeBody(b.body);scene.remove(b.mesh);balls.splice(i,1);}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.v.y-=10*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.material.opacity=Math.max(0,p.life);if(p.life<=0){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();particles.splice(i,1);}}
 if(levels.auto&&q('[data-auto]').checked&&autoClock>=Math.max(.5,2.8/levels.auto)&&cooldown===0&&!cleared){const target=chooseTarget();if(target){aim.copy(target.mesh.position);aimUpdate();shoot();}autoClock=0;}
 if(!cleared){
  const interval=Math.max(.6,2.5*Math.pow(.85,levels.speed-1)*relicFX.reload);
  const salvo=fx.salvo&&turrets.some(t=>t.timer<=dt);
  for(const turret of turrets){turret.timer-=dt;turret.recoil=Math.max(0,turret.recoil-dt);turret.barrel.position.z=-.65+turret.recoil;
   if(turret.timer<=0||salvo){const block=chooseTarget();if(block){const target=block.mesh.position.clone(),source=new THREE.Vector3(turret.x,1.3,turret.z),v=velocityToTarget(source,target),dir=new THREE.Vector3(v.x,v.y,v.z).normalize();turret.mount.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),dir);source.addScaledVector(dir,1.6);fireVolley(source,target);turret.recoil=.2;}turret.timer=interval;}
  }
 }
 recoil=Math.max(0,recoil-dt);barrel.position.z=-.65+recoil*1.5;shake=Math.max(0,shake-dt);hudClock+=dt;saveClock+=dt;
 if(hudClock>.15){ui();hudClock=0;}
 if(saveClock>1){if(saveDirty)persist();saveClock=0;}
 renderer.render(scene,camera);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

}catch(error){q('.loading').textContent='3Dを読み込めませんでした。画面を開き直してお試しください。';q('.loading').setAttribute('role','alert');q('.status').textContent='この試作にはWebGLと3Dライブラリの読み込みが必要です。';console.error(error)}})();
