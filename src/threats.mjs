export const THREATS=Object.freeze([
 {id:'quiet',name:'沈黙の城',description:'いつもと変わらない、静かな城。',hpMultiplier:1,damageMultiplier:1,spawnMultiplier:1,coinMultiplier:1},
 {id:'armor',name:'耐灰の城壁',description:'厚い城壁が、砲撃を受け止める。',hpMultiplier:1.25,damageMultiplier:1,spawnMultiplier:1,coinMultiplier:1},
 {id:'legion',name:'兵舎の活性',description:'兵舎から、兵が次々に現れる。',hpMultiplier:1,damageMultiplier:1,spawnMultiplier:.8,coinMultiplier:1},
 {id:'embers',name:'紅い火種',description:'兵の砲撃が、いつもより激しい。',hpMultiplier:1,damageMultiplier:1.35,spawnMultiplier:1,coinMultiplier:1},
 {id:'fractured',name:'脆い石材',description:'傷んだ城壁の奥に、多くのコインが眠る。',hpMultiplier:.85,damageMultiplier:1,spawnMultiplier:1,coinMultiplier:1.15},
].map(Object.freeze));
export function getThreat(id){return THREATS.find(t=>t.id===id)||THREATS[0];}
export function drawThreat(day,random=Math.random){if(!Number.isFinite(day)||day<=1)return 'quiet';const value=random(),bounded=Number.isFinite(value)?Math.max(0,Math.min(1-Number.EPSILON,value)):0;return THREATS[Math.floor(bounded*THREATS.length)].id;}
