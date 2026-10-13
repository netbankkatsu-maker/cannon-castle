import test from 'node:test';import assert from 'node:assert/strict';
import {pinchTransform} from '../src/network.mjs';
test('pinch keeps the map point under the moving fingers, including clamped zoom',()=>{
 const start={scale:1,offset:{x:-80,y:-120},points:[{x:110,y:200},{x:210,y:200}]},rect={left:10,top:50};
 const anchor={x:(160-rect.left-start.offset.x)/start.scale,y:(200-rect.top-start.offset.y)/start.scale};
 for(const distance of [10,150,800]){
  const result=pinchTransform(start,[{x:230-distance/2,y:250},{x:230+distance/2,y:250}],rect);
  assert.ok(result.scale>=.68&&result.scale<=1.8);
  assert.ok(Math.abs(anchor.x*result.scale+result.offset.x-(230-rect.left))<1e-8);
  assert.ok(Math.abs(anchor.y*result.scale+result.offset.y-(250-rect.top))<1e-8);
 }
});
