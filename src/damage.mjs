export const BLOCK_HP=100;
export function damageBlock(block,amount){const before=Math.max(0,block.hp);block.hp=Math.max(0,before-Math.max(0,Number.isFinite(amount)?amount:0));return before-block.hp}
export function destructionPercent(blocks){if(!blocks.length)return 0;const remaining=blocks.reduce((s,b)=>s+Math.max(0,Math.min(BLOCK_HP,b.hp)),0);return Math.max(0,Math.min(100,(1-remaining/(blocks.length*BLOCK_HP))*100))}
export function blastDamage(distance,radius,level){return distance>=radius||distance<0?0:(55+level*25)*(1-distance/radius)+25}
export function shouldClearRubble(blocks){return blocks.length>0&&destructionPercent(blocks)>=95}
