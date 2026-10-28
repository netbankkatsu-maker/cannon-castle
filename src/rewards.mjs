import {stageScale} from './progression.mjs?v=12';
// Fixed identities are independent of physics positions and survive reconstruction.
export const DEVICE_IDS=Object.freeze(['front','archive','forge','deep','barracks']);
const shares={front:.10,archive:.15,forge:.20,deep:.30,barracks:.25};
export function castleRewardBudget(blocks,stage=1){
 return (blocks.length*(3+stage)+(80+stage*20)+(50+stage*15))*stageScale(stage).reward;
}
export function deviceReward(block,blocks,stage=1,{treasure=false,chain=0,coins=1,threat=1}={}){
 if(!['device','barracks'].includes(block.role)||!Object.hasOwn(shares,block.deviceId))return 0;
 return castleRewardBudget(blocks,stage)*shares[block.deviceId]*(treasure&&block.role==='device'?2:1)*(1+Math.min(20,Math.max(0,chain))*.025)*coins*threat;
}
export function coreSoulReward(blocks,stage=1,{permanent=1,relic=1}={}){
 return blocks.length*.15*(1+.05*Math.max(1,Math.min(10000,stage)))*permanent*relic;
}
export function deviceClaimKey(stage,id){return `${stage}:${id}`;}
export function deviceIsClaimed(block,stage,claimed,legacyTreasure=[],cleared=[]){
 return cleared.includes(stage)||claimed.has(deviceClaimKey(stage,block.deviceId))||(block.deviceId==='front'&&legacyTreasure.includes(stage));
}
export function claimDevice(block,stage,claimed,legacyTreasure=[],cleared=[]){
 if(block.hp>0||!['device','barracks'].includes(block.role)||!DEVICE_IDS.includes(block.deviceId)||deviceIsClaimed(block,stage,claimed,legacyTreasure,cleared))return false;
 claimed.add(deviceClaimKey(stage,block.deviceId));return true;
}
export function claimCore(stage,claimed){if(claimed.has(stage))return false;claimed.add(stage);return true;}
export function validDeviceClaims(value){return Array.isArray(value)&&value.length<=50000&&new Set(value).size===value.length&&value.every(key=>typeof key==='string'&&/^[1-9]\d{0,4}:(front|archive|forge|deep|barracks)$/.test(key)&&Number(key.split(':')[0])<=10000);}
