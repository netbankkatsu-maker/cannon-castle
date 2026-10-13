export const turretPrice=count=>Math.floor(120*1.7**count);
export function availableCells(turrets=[]){const cells=[];for(let x=-9;x<=9;x+=3)for(let z=-10;z<=14;z+=3){const castle=Math.abs(x)<5&&z>=-9&&z<=0;const player=Math.hypot(x,z-12)<3;const occupied=turrets.some(t=>t.x===x&&t.z===z);if(!castle&&!player&&!occupied)cells.push({x,z})}return cells}
export function canPlaceTurret(cell,turrets,coins){return coins>=turretPrice(turrets.length)&&availableCells(turrets).some(c=>c.x===cell.x&&c.z===cell.z)}
export function reloadProgress(remaining,duration){if(duration<=0)return 100;return Math.min(100,Math.max(0,(1-remaining/duration)*100))}
export function velocityToTarget(source,target,speed=27,gravity=16){const dx=target.x-source.x,dy=target.y-source.y,dz=target.z-source.z;const time=Math.max(.4,Math.hypot(dx,dz)/speed);return {x:dx/time,y:(dy+gravity*time*time/2)/time,z:dz/time,time}}
