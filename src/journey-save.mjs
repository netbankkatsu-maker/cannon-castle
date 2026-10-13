import {THREATS} from './threats.mjs?v=10';
import {STORY} from './story.mjs?v=10';
import {RELICS} from './relics.mjs?v=10';
import {ALTAR_UPGRADES,altarEffects,defaultLoadout,cargoWeight,validLoadout} from './expedition.mjs?v=10';
import {loadSave,validateSave} from './save.mjs?v=10';
export const JOURNEY_SAVE_KEY='cannon-castle-journey-v2';
export const SAVE_KEY=JOURNEY_SAVE_KEY;
const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const amount=n=>Number.isFinite(n)&&n>=0&&n<=1e100;
export function validateJourney(raw){
 if(!raw||raw.version!==2||!['home','battle'].includes(raw.screen)||!amount(raw.souls)||!Array.isArray(raw.altarOwned)||new Set(raw.altarOwned).size!==raw.altarOwned.length)return null;
 const ids=new Set(ALTAR_UPGRADES.map(n=>n.id));if(raw.altarOwned.some(id=>!ids.has(id))||ALTAR_UPGRADES.some(n=>raw.altarOwned.includes(n.id)&&n.requires.some(p=>!raw.altarOwned.includes(p))))return null;
 const storySeen=raw.storySeen??[];if(!Array.isArray(storySeen)||storySeen.length>50||storySeen.some(id=>!Object.hasOwn(STORY,id)))return null;const fx=altarEffects(raw.altarOwned);if(!validLoadout(raw.loadout,fx.carryCapacity)||!int(raw.bestDay,1,10000)||!int(raw.journeys,0,1e9))return null;
 let run=null;
 if(raw.run!=null){const base=validateSave({...raw.run,version:1,sound:raw.sound});if(!base||!Number.isFinite(raw.run.hp)||raw.run.hp<0||raw.run.hp>fx.maxHP||raw.run.maxHP!==fx.maxHP||raw.run.ammoCapacity!==fx.ammoCapacity||cargoWeight(raw.run.inventory)>fx.carryCapacity||!['stone','iron','burst'].includes(raw.run.selectedAmmo)||!amount(raw.run.journeySouls)||!int(raw.run.day,1,10000))return null;
  const threat=raw.run.threat??'quiet';if(!THREATS.some(t=>t.id===threat))return null;const relics=raw.run.relics??[],pendingChoices=raw.run.pendingChoices??null,relicIds=new Set(RELICS.map(r=>r.id));if(!Array.isArray(relics)||relics.length>20000||relics.some(id=>!relicIds.has(id))||(pendingChoices!==null&&(!Array.isArray(pendingChoices)||pendingChoices.length!==3||new Set(pendingChoices).size!==3||pendingChoices.some(id=>!relicIds.has(id)))))return null;const {version,sound,...progress}=base;run={...progress,hp:raw.run.hp,maxHP:fx.maxHP,ammo:raw.run.inventory.stone+raw.run.inventory.iron+raw.run.inventory.burst,ammoCapacity:fx.ammoCapacity,carryCapacity:fx.carryCapacity,inventory:{...raw.run.inventory},selectedAmmo:raw.run.selectedAmmo,journeySouls:raw.run.journeySouls,day:raw.run.day,threat,relics:[...relics],pendingChoices:pendingChoices?[...pendingChoices]:null};
 }
 if(raw.screen==='battle'&&!run)return null;
 return {version:2,storySeen:[...new Set(storySeen)],screen:raw.screen,souls:raw.souls,altarOwned:[...raw.altarOwned],loadout:{...raw.loadout},sound:raw.sound!==false,run,bestDay:raw.bestDay,journeys:raw.journeys};
}
export function loadJourney(storage){try{const text=storage.getItem(JOURNEY_SAVE_KEY);if(text!==null&&text!==undefined)return validateJourney(JSON.parse(text));const old=loadSave(storage);if(!old)return null;return {version:2,storySeen:[],screen:'home',souls:Math.min(100,Math.floor(old.clearClaimed.length*5)),altarOwned:[],loadout:{...defaultLoadout},sound:old.sound,run:null,bestDay:old.stage,journeys:0};}catch{return null;}}
export function writeJourney(storage,state){try{const checked=validateJourney({...state,version:2});if(!checked)return false;storage.setItem(JOURNEY_SAVE_KEY,JSON.stringify(checked));return true;}catch{return false;}}
