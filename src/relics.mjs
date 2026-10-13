export const RELICS=Object.freeze([
 {id:'siege',name:'攻城の紋章',benefit:'威力 ＋35%',drawback:'リロード ＋20%',power:1.35,reload:1.2},
 {id:'haste',name:'疾風の紋章',benefit:'リロード −20%',drawback:'威力 −10%',reload:.8,power:.9},
 {id:'glass',name:'硝子の紋章',benefit:'威力 ＋50%',drawback:'被ダメージ ＋35%',power:1.5,incoming:1.35},
 {id:'ward',name:'守護の紋章',benefit:'被ダメージ −20%',drawback:'リロード ＋15%',incoming:.8,reload:1.15},
 {id:'greed',name:'黄金の紋章',benefit:'コイン ＋40%',drawback:'被ダメージ ＋20%',coins:1.4,incoming:1.2},
 {id:'powder',name:'火薬の紋章',benefit:'爆風範囲 ＋30%',drawback:'威力 −15%',radius:1.3,power:.85},
 {id:'burden',name:'重撃の紋章',benefit:'威力 ＋20%',drawback:'リロード ＋10%',power:1.2,reload:1.1},
 {id:'memory',name:'記憶の紋章',benefit:'魂 ＋40%',drawback:'コイン −20%',souls:1.4,coins:.8},
].map(Object.freeze));
export function drawRelics(random=Math.random){const pool=RELICS.map(r=>r.id);for(let i=pool.length-1;i>0;i--){const value=random(),bounded=Number.isFinite(value)?Math.max(0,Math.min(1-Number.EPSILON,value)):0;const j=Math.floor(bounded*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,3);}
const ranges={power:[.2,10],reload:[.25,4],incoming:[.25,5],coins:[.2,10],radius:[.6,2],souls:[.2,10]};
export function relicEffects(ids=[]){const logs=Object.fromEntries(Object.keys(ranges).map(key=>[key,0]));for(const id of ids){const relic=RELICS.find(r=>r.id===id);if(!relic)continue;for(const key of Object.keys(ranges))logs[key]+=Math.log(relic[key]||1);}return Object.fromEntries(Object.entries(ranges).map(([key,[min,max]])=>[key,Math.max(min,Math.min(max,Math.exp(logs[key])))]));}
