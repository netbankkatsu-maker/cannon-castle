const definitions=[
 ['vessel','頑丈な砲台','最大耐久 ＋50',8,[],100,110],
 ['reserve','器の拡張','灰の器 ＋20',8,[],300,110],
 ['might','砲術の刻印','砲撃威力 ＋20%',10,[],500,110],
 ['memory','遠征の記憶','開始コイン ＋100',10,[],700,110],
 ['bulwark','不落の砲台','最大耐久 ＋50',20,['vessel'],100,310],
 ['arsenal','深い灰の器','灰の器 ＋30',20,['reserve'],300,310],
 ['legacy','伝承の砲術','砲撃威力 ＋30%',35,['might','memory'],500,510],
 ['harvest','魂の収穫','魂の獲得 ＋25%',25,['memory'],700,310],
];
export const ALTAR_UPGRADES=definitions.map(([id,name,description,cost,requires,x,y])=>Object.freeze({id,name,description,cost,requires:Object.freeze(requires),x,y}));
export function canBuyAltar(id,owned=[],souls=0){const node=ALTAR_UPGRADES.find(n=>n.id===id);return !!node&&!owned.includes(id)&&Number.isFinite(souls)&&souls>=node.cost&&node.requires.every(p=>owned.includes(p));}
export function buyAltar(id,owned=[],souls=0){if(!canBuyAltar(id,owned,souls))return null;return {souls:souls-ALTAR_UPGRADES.find(n=>n.id===id).cost,owned:[...owned,id]};}
export function altarEffects(owned=[]){const has=id=>owned.includes(id);return {maxHP:100+(has('vessel')?50:0)+(has('bulwark')?50:0),carryCapacity:40+(has('reserve')?20:0)+(has('arsenal')?30:0),ammoCapacity:40+(has('reserve')?20:0)+(has('arsenal')?30:0),powerMultiplier:1+(has('might')?.2:0)+(has('legacy')?.3:0),rewardMultiplier:has('harvest')?1.25:1,startCoins:has('memory')?100:0};}
export const CARGO_TYPES=Object.freeze([
 {id:'stone',name:'石弾',weight:1,kind:'ammo',description:'灰の重み1の標準弾'},
 {id:'iron',name:'鉄弾',weight:3,kind:'ammo',description:'重く強力な衝撃を与える'},
 {id:'burst',name:'炸裂弾',weight:4,kind:'ammo',description:'広範囲を爆破する'},
 {id:'repair',name:'修理キット',weight:5,kind:'item',description:'砲台の耐久を35回復する'},
].map(Object.freeze));
export const defaultLoadout=Object.freeze({stone:20,iron:4,burst:2,repair:0});
function validCounts(loadout){return !!loadout&&typeof loadout==='object'&&Object.keys(loadout).every(id=>CARGO_TYPES.some(t=>t.id===id))&&CARGO_TYPES.every(t=>Number.isSafeInteger(loadout[t.id])&&loadout[t.id]>=0&&loadout[t.id]<=10000);}
export function cargoWeight(loadout){return validCounts(loadout)?CARGO_TYPES.reduce((sum,t)=>sum+loadout[t.id]*t.weight,0):Infinity;}
export function validLoadout(loadout,capacity){return Number.isFinite(capacity)&&cargoWeight(loadout)<=capacity&&loadout.stone+loadout.iron+loadout.burst>0;}
export function startJourney(meta={},loadout=defaultLoadout){const fx=altarEffects(meta.altarOwned||[]);if(!validLoadout(loadout,fx.carryCapacity))return null;const inventory={...loadout};return {coins:fx.startCoins,stage:1,levels:{power:1,speed:1,auto:0},owned:[],turrets:[],auto:false,hp:fx.maxHP,maxHP:fx.maxHP,ammo:inventory.stone+inventory.iron+inventory.burst,ammoCapacity:fx.ammoCapacity,carryCapacity:fx.carryCapacity,inventory,selectedAmmo:inventory.stone?'stone':inventory.iron?'iron':'burst',treasureClaimed:[],clearClaimed:[],journeySouls:0,day:1,relics:[],pendingChoices:null,threat:'quiet'};}
export function spendInventory(inventory,type,count=1){if(!validCounts(inventory)||!CARGO_TYPES.some(t=>t.id===type)||!Number.isSafeInteger(count)||count<=0||inventory[type]<count)return null;return {...inventory,[type]:inventory[type]-count};}
export function useRepair(hp,maxHP,inventory){if(!Number.isFinite(hp)||!Number.isFinite(maxHP)||hp<=0||hp>=maxHP)return null;const next=spendInventory(inventory,'repair');return next?{hp:Math.min(maxHP,hp+35),inventory:next}:null;}
export function spendAmmo(ammo,count=1){return Number.isSafeInteger(ammo)&&Number.isSafeInteger(count)&&ammo>=0&&count>0&&ammo>=count?ammo-count:null;}
export function takeHit(hp,damage){const next=Math.max(0,(Number.isFinite(hp)?hp:0)-Math.max(0,Number.isFinite(damage)?damage:0));return {hp:next,defeated:next<=0};}
export function soulReward(dealt,maxHP,stage=1){if(!Number.isFinite(dealt)||!Number.isFinite(maxHP)||dealt<=0||maxHP<=0)return 0;return Math.min(dealt,maxHP)/maxHP*.15*(1+.05*Math.max(1,Math.min(10000,Number(stage)||1)));}
