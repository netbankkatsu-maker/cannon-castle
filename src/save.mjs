import {UPGRADES} from './progression.mjs?v=12';
import {availableCells} from './turrets.mjs?v=12';
export const SAVE_KEY='cannon-castle-save-v1';
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const claims=(values)=>Array.isArray(values)&&values.every(n=>integer(n,1,10000))?[...new Set(values)]:[];
export function validateSave(raw){
 if(!raw||typeof raw!=='object'||raw.version!==1||!Number.isFinite(raw.coins)||raw.coins<0||raw.coins>1e100||!integer(raw.stage,1,10000))return null;
 const levels=raw.levels;if(!levels||!integer(levels.power,1,10000)||!integer(levels.speed,1,10000)||!integer(levels.auto,0,10000))return null;
 if(!Array.isArray(raw.owned)||raw.owned.length>UPGRADES.length||new Set(raw.owned).size!==raw.owned.length)return null;
 const ids=new Set(UPGRADES.map(n=>n.id));if(raw.owned.some(id=>!ids.has(id))||UPGRADES.some(n=>raw.owned.includes(n.id)&&n.requires.some(p=>!raw.owned.includes(p))))return null;
 if(!Array.isArray(raw.turrets))return null;const turrets=[];
 for(const cell of raw.turrets){if(!cell||!availableCells(turrets).some(c=>c.x===cell.x&&c.z===cell.z))return null;turrets.push({x:cell.x,z:cell.z});}
 return {version:1,coins:raw.coins,stage:raw.stage,levels:{power:levels.power,speed:levels.speed,auto:levels.auto},owned:[...raw.owned],turrets,auto:raw.auto===true,sound:raw.sound!==false,treasureClaimed:claims(raw.treasureClaimed),clearClaimed:claims(raw.clearClaimed)};
}
export function loadSave(storage){try{return validateSave(JSON.parse(storage.getItem(SAVE_KEY)));}catch{return null;}}
export function writeSave(storage,state){try{const saved=validateSave({...state,version:1});if(!saved)return false;storage.setItem(SAVE_KEY,JSON.stringify(saved));return true;}catch{return false;}}
