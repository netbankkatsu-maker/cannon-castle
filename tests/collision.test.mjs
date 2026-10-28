import test from 'node:test';import assert from 'node:assert/strict';
import {MATERIALS,collisionDamage,createContactGate,consumeSpecial,createChain} from '../src/collision.mjs';
import {castleBlueprint} from '../src/castles.mjs';
import {destructionPercent} from '../src/damage.mjs';
test('material HP and mass vary, rewards use damage fraction, every castle has internal stores',()=>{
 assert.deepEqual(MATERIALS.wood.hp,50);assert.equal(MATERIALS.stone.mass,3.5);
 for(let stage=1;stage<=5;stage++){
  const {blocks}=castleBlueprint(stage);
  for(const b of blocks){assert.ok(b.mass>0);assert.ok(b.maxHP>0);assert.ok(b.buildingId);assert.ok(MATERIALS[b.material]);}
  assert.equal(blocks.filter(b=>b.role==='powder').length,1);assert.equal(blocks.filter(b=>b.role==='device').length,4);assert.equal(blocks.filter(b=>b.role==='core').length,1);
 }
 assert.equal(destructionPercent([{hp:25,maxHP:50},{hp:90,maxHP:180}]),50);
});
test('stronger and heavier impacts cause damage; rest and invalid physics do not',()=>{
 assert.equal(collisionDamage(3.5,2),0);assert.equal(collisionDamage(3.5,NaN),0);
 assert.ok(collisionDamage(3.5,6)>collisionDamage(.8,6));assert.ok(collisionDamage(3.5,6)>collisionDamage(3.5,3));assert.equal(collisionDamage(3.5,100),120);
 const gate=createContactGate();assert.ok(gate.accept(1,2,0));assert.equal(gate.accept(2,1,.1),false);assert.ok(gate.accept(2,1,.41));gate.clear();assert.ok(gate.accept(1,2,.42));
});
test('powder detonates once and treasure cannot be claimed by rebuilding or restoring',()=>{
 const claimed=new Set();const powder={hp:0,role:'powder'};assert.equal(consumeSpecial(powder,claimed,1),'powder');assert.equal(consumeSpecial(powder,claimed,1),null);
 assert.equal(consumeSpecial({hp:1,role:'treasure'},claimed,1),null);assert.equal(consumeSpecial({hp:0,role:'treasure'},claimed,1),'treasure');assert.equal(consumeSpecial({hp:0,role:'treasure'},new Set([...claimed]),1),null);assert.equal(consumeSpecial({hp:0,role:'treasure'},claimed,2),'treasure');
});
test('chain groups one-second bursts and duplicate events cannot extend it',()=>{
 const chain=createChain();assert.equal(chain.hit('a',0),1);assert.equal(chain.hit('a',.7),1);assert.equal(chain.hit('b',.8),2);assert.equal(chain.hit('c',1.5),3);assert.equal(chain.hit('d',2.6),1);chain.expire(3.7);assert.equal(chain.count,0);chain.clear();assert.equal(chain.count,0);
});
