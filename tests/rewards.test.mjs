import test from 'node:test';
import assert from 'node:assert/strict';
import {castleBlueprint} from '../src/castles.mjs';
import {deviceReward,castleRewardBudget,coreSoulReward,claimDevice,claimCore,deviceIsClaimed,validDeviceClaims} from '../src/rewards.mjs';
import {shouldCompleteCastle} from '../src/damage.mjs';
import {startJourney} from '../src/expedition.mjs';
import {validateJourney} from '../src/journey-save.mjs';

test('all five castles have stable, distinct devices behind the walls and a central core',()=>{
 for(let stage=1;stage<=5;stage++){
  const {blocks}=castleBlueprint(stage),devices=blocks.filter(b=>b.role==='device'||b.role==='barracks');
  assert.equal(devices.length,5);assert.equal(new Set(devices.map(b=>b.deviceId)).size,5);
  assert.equal(blocks.filter(b=>b.role==='core').length,1);
  assert.ok(devices.every(b=>b.z<-2.5&&Math.abs(b.x)<=4));
  assert.deepEqual(castleBlueprint(stage+5).blocks.filter(b=>b.deviceId).map(b=>b.deviceId),devices.map(b=>b.deviceId));
  assert.ok(blocks.some(b=>b.z===-2.5&&b.y>.4));
 }
});
test('only devices and barracks yield temporary currency, with the previous full-castle budget',()=>{
 const {blocks}=castleBlueprint(1),budget=castleRewardBudget(blocks,1);
 const rewards=blocks.map(b=>deviceReward(b,blocks,1));
 assert.ok(Math.abs(rewards.reduce((a,b)=>a+b,0)-budget)<1e-8);
 for(const b of blocks.filter(b=>!['device','barracks'].includes(b.role)))assert.equal(deviceReward(b,blocks,1),0);
 const front=blocks.find(b=>b.deviceId==='front'),barracks=blocks.find(b=>b.role==='barracks');
 assert.equal(deviceReward(front,blocks,1),budget*.1);
 assert.equal(deviceReward(front,blocks,1,{treasure:true,chain:20,coins:1.2,threat:1.15}),budget*.1*2*1.5*1.2*1.15);
 assert.equal(deviceReward(barracks,blocks,1,{treasure:true}),budget*.25);
 assert.ok(castleRewardBudget(blocks,6)>castleRewardBudget(blocks,5));
});
test('destruction claims once across contact, blast, reconstruction and reload; partial damage pays nothing',()=>{
 const claimed=new Set(),front={role:'device',deviceId:'front',hp:1};
 assert.equal(claimDevice(front,1,claimed),false);front.hp=0;
 assert.equal(claimDevice(front,1,claimed),true);assert.equal(claimDevice(front,1,claimed),false);
 assert.equal(claimDevice({...front},1,new Set(JSON.parse(JSON.stringify([...claimed])))),false);
 assert.equal(claimDevice({...front},2,claimed),true);
 assert.equal(claimDevice({hp:0,role:'stone'},1,claimed),false);
 assert.equal(claimDevice({hp:0,role:'core'},1,claimed),false);
 assert.equal(claimDevice({hp:0,role:'powder'},1,claimed),false);
});
test('legacy treasure and completed stages suppress corresponding rewards without erasing balances',()=>{
 const run=startJourney();run.coins=999;run.journeySouls=7;run.treasureClaimed=[1];run.clearClaimed=[2];delete run.deviceClaimed;delete run.coreClaimed;
 const state=validateJourney({version:2,screen:'battle',souls:12,altarOwned:[],loadout:{stone:20,iron:4,burst:2,repair:0},sound:true,run,bestDay:2,journeys:1});
 assert.ok(state);assert.equal(state.run.coins,999);assert.equal(state.run.journeySouls,7);assert.deepEqual(state.run.coreClaimed,[2]);
 const front={role:'device',deviceId:'front',hp:0},deep={role:'device',deviceId:'deep',hp:0},claims=new Set(state.run.deviceClaimed);
 assert.equal(claimDevice(front,1,claims,state.run.treasureClaimed,state.run.clearClaimed),false);
 assert.equal(claimDevice(deep,1,claims,state.run.treasureClaimed,state.run.clearClaimed),true);
 assert.equal(claimDevice(deep,2,claims,[],state.run.clearClaimed),false);
 assert.equal(deviceIsClaimed(front,1,claims,[1],[]),true);
});
test('core release grants the normalized former soul reward once and does not trigger premature victory',()=>{
 const {blocks}=castleBlueprint(1),claimed=new Set();
 assert.equal(coreSoulReward(blocks,1),blocks.length*.15*1.05);
 assert.equal(coreSoulReward(blocks,1,{permanent:1.25,relic:1.2}),blocks.length*.15*1.05*1.25*1.2);
 assert.equal(claimCore(1,claimed),true);assert.equal(claimCore(1,new Set([...claimed])),false);
 const physical=blocks.map(b=>({...b,hp:b.role==='core'?0:b.maxHP,origin:{y:b.y}}));
 assert.equal(shouldCompleteCastle(physical),false);
 for(const b of physical)b.collapsed=true;
 assert.equal(shouldCompleteCastle(physical),true);assert.equal(claimCore(1,claimed),false);
});
test('claim identities reject unknown or duplicate records and every new journey starts clean',()=>{
 assert.equal(validDeviceClaims(['1:front','10000:barracks']),true);
 for(const claims of [['1:front','1:front'],['10001:front'],['0:deep'],['01:front'],['1:fake'],[1],null])assert.equal(validDeviceClaims(claims),false);
 const run=startJourney();assert.deepEqual(run.deviceClaimed,[]);assert.deepEqual(run.coreClaimed,[]);
});
