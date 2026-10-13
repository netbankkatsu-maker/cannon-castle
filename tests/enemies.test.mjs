import test from 'node:test';
import assert from 'node:assert/strict';
import { enemyStats, advanceProjectile } from '../src/enemies.mjs';

test('enemy progression is gradual and spawns never become unbounded', () => {
  assert.deepEqual(enemyStats(1), {hp:35,damage:4,speed:1.2,spawnInterval:4,shotInterval:2,shotRange:10,projectileSpeed:15});
  assert.equal(enemyStats(4).damage,4);
  assert.equal(enemyStats(5).damage,5);
  assert.equal(enemyStats(10).hp,80);
  assert.equal(enemyStats(10000).spawnInterval,2.5);
  assert.deepEqual(enemyStats(-10),enemyStats(1));
});

test('projectiles travel at a fixed speed and stop at their target without overshoot', () => {
  const projectile={position:{x:0,y:0,z:0},target:{x:3,y:4,z:0},speed:2};
  assert.equal(advanceProjectile(projectile,.5),false);
  assert.ok(Math.abs(projectile.position.x-.6)<1e-10);
  assert.ok(Math.abs(projectile.position.y-.8)<1e-10);
  assert.equal(advanceProjectile(projectile,10),true);
  assert.deepEqual(projectile.position,projectile.target);
  assert.equal(advanceProjectile(projectile,.1),true);
});

test('paused and invalid time steps do not move distant projectiles', () => {
  const projectile={position:{x:0,y:0,z:0},target:{x:10,y:0,z:0},speed:15};
  for (const dt of [0,-1,NaN]) assert.equal(advanceProjectile(projectile,dt),false);
  assert.equal(projectile.position.x,0);
});
