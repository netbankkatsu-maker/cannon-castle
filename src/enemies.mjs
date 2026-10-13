const MAX_ENEMIES = 12, MAX_PROJECTILES = 24;
const positiveStage = stage => Math.max(1, Math.min(10000, Math.floor(Number(stage) || 1)));
export function enemyStats(stage = 1) {
  stage = positiveStage(stage);
  return { hp: 30 + stage * 5, damage: 4 + Math.floor(stage / 5), speed: 1.2,
    spawnInterval: Math.max(2.5, 4 - Math.floor(stage / 10) * .1), shotInterval: 2, shotRange: 10, projectileSpeed: 15 };
}
/** Advances a plain {position, target, speed} projectile; returns true on arrival. */
export function advanceProjectile(projectile, dt) {
  const { position, target } = projectile;
  const dx = target.x - position.x, dy = target.y - position.y, dz = target.z - position.z;
  const distance = Math.hypot(dx, dy, dz), step = Math.max(0, Number(dt) || 0) * projectile.speed;
  if (distance <= step || distance < .001) {
    position.x = target.x; position.y = target.y; position.z = target.z; return true;
  }
  const ratio = step / distance;
  position.x += dx * ratio; position.y += dy * ratio; position.z += dz * ratio;
  return false;
}

/** Small fixed pools keep enemy visuals independent from the physics world. */
export function createEnemies({ THREE, scene, onHit = () => {}, onShot = () => {}, onDefeat = () => {}, reduced = false }) {
  const bodyGeometry = new THREE.BoxGeometry(.4, .62, .32);
  const headGeometry = new THREE.SphereGeometry(.22, 6, 4);
  const helmetGeometry = new THREE.BoxGeometry(.48, .13, .4);
  const gunGeometry = new THREE.BoxGeometry(.12, .12, .65);
  const legGeometry = new THREE.BoxGeometry(.12, .3, .15);
  const bulletGeometry = new THREE.SphereGeometry(.105, 6, 4);
  const coatMaterial = new THREE.MeshStandardMaterial({ color: 0x66534b, roughness: .85 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: .8 });
  const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x756756, roughness: .65 });
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff604b });
  const target = new THREE.Vector3(0, .9, 12);
  const soldiers = Array.from({ length: MAX_ENEMIES }, () => {
    const group = new THREE.Group();
    const add = (geometry, material, x, y, z) => { const part = new THREE.Mesh(geometry, material); part.position.set(x, y, z); group.add(part); return part; };
    add(bodyGeometry, coatMaterial, 0, .62, 0); add(headGeometry, skinMaterial, 0, 1.12, 0);
    add(helmetGeometry, metalMaterial, 0, 1.3, 0); add(gunGeometry, metalMaterial, .24, .7, .23);
    const left = add(legGeometry, metalMaterial, -.12, .2, 0), right = add(legGeometry, metalMaterial, .12, .2, 0);
    return { group, left, right, active: false, hp: 0, cooldown: 0, age: 0 };
  });
  const projectiles = Array.from({ length: MAX_PROJECTILES }, () => ({
    mesh: new THREE.Mesh(bulletGeometry, bulletMaterial), position: new THREE.Vector3(), target: target.clone(), speed: 15, damage: 0, active: false
  }));
  let stats = enemyStats(), barracks = [], spawnIn = 3, nextBarracks = 0, generation = 0, disposed = false;
  function clear() {
    generation++;
    for (const soldier of soldiers) { soldier.active = false; scene.remove(soldier.group); }
    for (const projectile of projectiles) { projectile.active = false; scene.remove(projectile.mesh); }
    spawnIn = 3; barracks = [];
  }
  function reset(stage, blocks, threat = {}) {
    clear(); stats = enemyStats(stage);stats.damage*=threat.damageMultiplier||1;stats.spawnInterval*=threat.spawnMultiplier||1; nextBarracks = 0;
    barracks = blocks.filter(block => block.role === 'barracks');
  }
  function spawn() {
    const live = barracks.filter(block => block.hp > 0 && !block.collapsed);
    const soldier = soldiers.find(candidate => !candidate.active);
    if (!live.length || !soldier) return;
    const block = live[nextBarracks++ % live.length], source = block.mesh?.position || block.origin || block.body?.position;
    if (!source) return;
    soldier.active = true; soldier.hp = stats.hp; soldier.cooldown = stats.shotInterval; soldier.age = 0;
    soldier.group.position.set(source.x, .05, source.z);
    soldier.left.rotation.x = soldier.right.rotation.x = 0;
    scene.add(soldier.group);
  }
  function fire(soldier) {
    const projectile = projectiles.find(candidate => !candidate.active);
    if (!projectile) return;
    projectile.active = true; projectile.damage = stats.damage; projectile.speed = stats.projectileSpeed;
    projectile.position.copy(soldier.group.position); projectile.position.y += .75;
    projectile.mesh.position.copy(projectile.position); projectile.target.copy(target); scene.add(projectile.mesh);
    onShot(projectile.position.clone());
  }
  function tick(dt) {
    if (disposed || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, .1);
    const version = generation;
    spawnIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = stats.spawnInterval; }
    for (const soldier of soldiers) {
      if (!soldier.active) continue;
      const position = soldier.group.position, dx = target.x - position.x, dz = target.z - position.z, distance = Math.hypot(dx, dz);
      soldier.group.rotation.y = Math.atan2(dx, dz);
      soldier.age += dt;
      if (distance > stats.shotRange - .5) {
        const step = Math.min(stats.speed * dt, distance - stats.shotRange + .5);
        position.x += dx / distance * step; position.z += dz / distance * step;
        soldier.left.rotation.x = (typeof reduced === 'function' ? reduced() : reduced) ? 0 : Math.sin(soldier.age * 9) * .4; soldier.right.rotation.x = -soldier.left.rotation.x;
      } else {
        soldier.left.rotation.x = soldier.right.rotation.x = 0;
        soldier.cooldown -= dt;
        if (soldier.cooldown <= 0) { soldier.cooldown = stats.shotInterval; fire(soldier); if (version !== generation) return; }
      }
    }
    for (const projectile of projectiles) {
      if (!projectile.active) continue;
      const arrived = advanceProjectile(projectile, dt); projectile.mesh.position.copy(projectile.position);
      if (arrived) {
        projectile.active = false; scene.remove(projectile.mesh);
        onHit(projectile.damage); if (version !== generation) return;
      }
    }
  }
  function hitTest(position, radius = .5) {
    if (disposed || !position) return false;
    return soldiers.some(soldier => {
      if (!soldier.active) return false;
      const p = soldier.group.position;
      return Math.hypot(p.x - position.x, p.y + .7 - position.y, p.z - position.z) <= Math.max(0, radius) + .55;
    });
  }
  function damageAt(position, radius, amount) {
    if (disposed || !position || !(radius > 0) || !(amount > 0)) return 0;
    let killed = 0;
    const version = generation;
    for (const soldier of soldiers) {
      if (!soldier.active) continue;
      const p = soldier.group.position, distance = Math.hypot(p.x - position.x, p.y + .7 - position.y, p.z - position.z);
      if (distance > radius) continue;
      soldier.hp -= amount * Math.max(.2, 1 - distance / radius);
      if (soldier.hp <= 0) {
        const location = p.clone(); location.y += .7; soldier.active = false; scene.remove(soldier.group); killed++;
        onDefeat(location); if (version !== generation) break;
      }
    }
    return killed;
  }
  function dispose() {
    clear(); disposed = true;
    for (const geometry of [bodyGeometry, headGeometry, helmetGeometry, gunGeometry, legGeometry, bulletGeometry]) geometry.dispose();
    for (const material of [coatMaterial, skinMaterial, metalMaterial, bulletMaterial]) material.dispose();
  }
  return { reset, tick, clear, dispose, damageAt, hitTest, get targets() { return soldiers.filter(soldier => soldier.active).map(soldier => soldier.group); }, get count() { return soldiers.filter(soldier => soldier.active).length; } };
}
