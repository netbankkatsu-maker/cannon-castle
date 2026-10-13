export const MATERIALS = {
 wood: {hp: 50, mass: .8, color: '#b78351'},
 brick: {hp: 100, mass: 1.8, color: '#c28368'},
 stone: {hp: 180, mass: 3.5, color: '#c1bfad'}
};
// Resting contacts cannot damage a structure. Energy is capped to prevent a
// numerical physics spike from destroying the entire castle.
export function collisionDamage(mass, speed, multiplier = 1) {
 if (!Number.isFinite(mass) || !Number.isFinite(speed) || mass <= 0 || speed < 2.5) return 0;
 return Math.min(120, mass * (speed * speed - 6.25) * .7) * multiplier;
}
export function createContactGate() {
 const contacts = new Map();
 return {
  accept(a,b,time) {
   const key = [a,b].sort((x,y)=>x-y).join(':');
   if (time - (contacts.get(key) ?? -Infinity) < .4) return false;
   contacts.set(key,time);
   if(contacts.size>2048)for(const [id,last] of contacts)if(time-last>2)contacts.delete(id);
   return true;
  },
  clear(){contacts.clear();}
 };
}
export function consumeSpecial(block,claimed,stage) {
 if(block.hp>0||block.specialUsed||!block.role)return null;
 block.specialUsed=true;
 if(block.role==='powder')return 'powder';
 if(block.role==='treasure'&&!claimed.has(stage)){claimed.add(stage);return 'treasure';}
 return null;
}
export function createChain() {
 let last=-Infinity,count=0;const seen=new Set();
 return {hit(key,time){if(time-last>1){count=0;seen.clear();}if(seen.has(key))return count;seen.add(key);last=time;return ++count;},clear(){last=-Infinity;count=0;seen.clear();},expire(time){if(time-last>1){count=0;seen.clear();}},get count(){return count;}};
}
