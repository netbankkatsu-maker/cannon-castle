import test from 'node:test';
import assert from 'node:assert/strict';
import {damageBlock,destructionPercent,blastDamage,shouldClearRubble} from '../src/damage.mjs';
test('fallen blocks remain destructible and repeated hits finish them',()=>{const b={hp:100};damageBlock(b,60);assert.equal(b.hp,40);damageBlock(b,30);assert.equal(b.hp,10);damageBlock(b,50);assert.equal(b.hp,0);assert.equal(destructionPercent([b]),100)});
test('progress measures remaining health, not mesh position',()=>{const blocks=[{hp:100},{hp:50},{hp:0}];assert.equal(Math.round(destructionPercent(blocks)),50);damageBlock(blocks[0],25);assert.equal(Math.round(destructionPercent(blocks)),58)});
test('last 5% is cleaned up; larger remnants remain playable',()=>{assert.equal(shouldClearRubble([{hp:11},{hp:0}]),false);assert.equal(shouldClearRubble([{hp:10},{hp:0}]),true);assert.equal(shouldClearRubble([]),false)});
test('blast range, upgrades, and duplicate hits are bounded',()=>{assert.equal(blastDamage(3,3,1),0);assert.ok(blastDamage(0,3,2)>blastDamage(0,3,1));const b={hp:20};assert.equal(damageBlock(b,100),20);assert.equal(damageBlock(b,100),0);damageBlock(b,-10);assert.equal(b.hp,0);assert.equal(destructionPercent([]),0)});
