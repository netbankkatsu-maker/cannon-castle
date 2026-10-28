import test from 'node:test';
import assert from 'node:assert/strict';
import {STEPS,advanceTutorial,practiceDamageAllowed,practiceBlueprint,placeCard,readTutorial,TUTORIAL_KEY} from '../src/tutorial.mjs';

test('the first loop advances only on each successful action and covers permanent purchase',()=>{
 let index=0;for(const step of STEPS){assert.equal(advanceTutorial(index,'next'),index);assert.equal(advanceTutorial(index,'wrong'),index);index=advanceTutorial(index,step.event);}assert.equal(index,12);assert.equal(STEPS.at(-1).event,'permanent');
});
test('practice targets cannot be broken early and are isolated from ordinary designs',()=>{
 const {blocks}=practiceBlueprint();assert.equal(blocks.length,4);
 for(const step of ['wall','device','barracks','core']){assert.equal(blocks.filter(b=>practiceDamageAllowed(b,step)).length,1);}
 for(const b of blocks){assert.equal(practiceDamageAllowed(b,'power'),false);assert.equal(practiceDamageAllowed(b,'loot'),false);}
 assert.ok(blocks.every(b=>b.maxHP>0&&b.key.startsWith('practice:')));
});
test('instruction cards leave room for targets in portrait and landscape',()=>{
 for(const [width,height] of [[320,740],[375,812],[740,320]]){
  const target={left:width/2-24,right:width/2+24,top:height/2-24,bottom:height/2+24};
  const cw=width>600?260:300,ch=150,p=placeCard(target,width,height,cw,ch);
  assert.ok(p.left>=0&&p.top>=0&&p.left+cw<=width&&p.top+ch<=height);
  assert.ok(p.left+cw<=target.left||p.left>=target.right||p.top+ch<=target.top||p.top>=target.bottom);
 }
});
test('separate tutorial progress validates resumable steps and never touches the normal save',()=>{
 const normal='unchanged',map=new Map([['cannon-castle-journey-v2',normal]]),store={getItem:k=>map.get(k)??null};
 assert.equal(readTutorial(store),null);
 for(const raw of [{version:1,status:'active',index:3},{version:1,status:'complete',index:11}]){map.set(TUTORIAL_KEY,JSON.stringify(raw));assert.deepEqual(readTutorial(store),raw);}
 for(const raw of [{version:2,status:'active',index:0},{version:1,status:'active',index:12},{version:1,status:'active',index:-1},{version:1,status:'bad',index:0}]){map.set(TUTORIAL_KEY,JSON.stringify(raw));assert.equal(readTutorial(store),null);}
 assert.equal(map.get('cannon-castle-journey-v2'),normal);
});
