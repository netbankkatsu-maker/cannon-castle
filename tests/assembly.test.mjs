import test from 'node:test';import assert from 'node:assert/strict';import {assemblyProgress} from '../src/assembly.mjs';
test('reverse assembly starts at rubble and reaches original position for every block',()=>{for(let i=0;i<200;i++){assert.equal(assemblyProgress(0,i,200),0);assert.equal(assemblyProgress(1.4,i,200),1);let prev=0;for(let t=0;t<1.4;t+=.05){const next=assemblyProgress(t,i,200);assert.ok(next>=prev&&next<=1);prev=next}}});
test('reduced motion restores immediately',()=>assert.equal(assemblyProgress(0,199,200,true),1));
