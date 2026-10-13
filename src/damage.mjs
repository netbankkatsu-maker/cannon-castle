export const BLOCK_HP=100;
export function damageBlock(block,amount){const before=Math.max(0,block.hp);block.hp=Math.max(0,before-Math.max(0,Number.isFinite(amount)?amount:0));return before-block.hp}
export function destructionPercent(blocks){if(!blocks.length)return 0;const remaining=blocks.reduce((s,b)=>s+Math.max(0,Math.min(BLOCK_HP,b.hp)),0);return Math.max(0,Math.min(100,(1-remaining/(blocks.length*BLOCK_HP))*100))}
export function blastDamage(distance,radius,level){return distance>=radius||distance<0?0:(55+level*25)*(1-distance/radius)+25}
export function shouldClearRubble(blocks){return blocks.length>0&&destructionPercent(blocks)>=95}
// The silhouette is gone when most elevated masonry and a majority of all
// masonry no longer occupy their original, upright structure. Rubble HP is irrelevant.
export function structureState(blocks){
 const structural=blocks.filter(b=>b.origin&&b.origin.y>=1);
 const collapsed=b=>b.hp<=0||b.collapsed===true;
 const allRatio=blocks.length?blocks.filter(collapsed).length/blocks.length:0;
 const upperRatio=structural.length?structural.filter(collapsed).length/structural.length:allRatio;
 const complete=blocks.length>0&&allRatio>=.55&&upperRatio>=.70;
 const progress=blocks.length?Math.min(1,allRatio/.55,upperRatio/.70):0;
 return {complete,progress,allRatio,upperRatio};
}
export function shouldCompleteCastle(blocks){return structureState(blocks).complete||shouldClearRubble(blocks)}
export function shapeDestructionPercent(blocks){return Math.min(99,Math.floor(structureState(blocks).progress*100))}
