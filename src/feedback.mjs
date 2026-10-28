/** Cosmetic rewards: currency accounting always belongs to the game. */
export function createFeedback({ root, money, reduced = false, sound = true, onSoundChange = () => {} }) {
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden;';
  document.body.append(overlay);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sound-toggle';
  (root.querySelector('.top') || root).append(button);
  let enabled = Boolean(sound), context, activeVoices = 0, pending, lastFlush = 0;
  let sequence = 1, label, labelUntil = 0, disposed = false, moneyAnimation;
  const coins = new Set(), animations = new Set(), voices = new Set();
  const prefersReduced = () => typeof reduced === 'function' ? reduced() : Boolean(reduced);
  function paintButton() {
    button.textContent = enabled ? '♪' : '♪̸';
    button.setAttribute('aria-label', enabled ? '音を消す' : '音を有効にする');
    button.setAttribute('aria-pressed', String(enabled));
    button.title = enabled ? '音を消す' : '音を有効にする';
  }
  function unlock() {
    if (disposed || !enabled || document.hidden) return;
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) return;
    try {
      context ||= new Audio();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { /* Sound may be unavailable; gameplay remains usable. */ }
  }
  function tone(big, count, core = false) {
    if (!enabled || document.hidden || !context || context.state !== 'running' || activeVoices >= 6) return;
    const notes = core ? [0, 7, 19] : big || count >= 12 ? [0, 7] : count >= 6 ? [0, 12] : [0];
    for (const interval of notes) {
      if (activeVoices >= 6) break;
      try {
        const oscillator = context.createOscillator(), gain = context.createGain();
        const at = context.currentTime, frequency = (core ? 196 : 640) * 2 ** ((Math.min(7, Math.max(0, count - 1)) * .5 + interval) / 12), duration = core ? .48 : .13;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(core ? .016 : notes.length > 1 ? .012 : .02, at + .006);
        gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
        oscillator.connect(gain); gain.connect(context.destination);
        activeVoices++; voices.add(oscillator);
        oscillator.onended = () => { activeVoices = Math.max(0, activeVoices - 1); voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at); oscillator.stop(at + duration + .02);
      } catch { /* Ignore audio device failures. */ }
    }
  }
  function animate(element, frames, options, complete) {
    if (typeof element.animate !== 'function') { complete?.(); return; }
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.onfinish = () => { animations.delete(animation); complete?.(); };
    animation.oncancel = () => animations.delete(animation);
    return animation;
  }
  function bounce() {
    if (prefersReduced()) return;
    moneyAnimation?.cancel();
    moneyAnimation = animate(money, [{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }, { transform: 'scale(1)' }], { duration: 190 });
  }
  function flush() {
    if (!pending || disposed || document.hidden) return;
    const reward = pending; pending = undefined;
    if (prefersReduced()) { tone(reward.big, reward.chain); return; }
    const target = money.getBoundingClientRect();
    const tx = target.left + target.width / 2, ty = target.top + target.height / 2;
    const number = reward.big ? 6 : 3;
    for (let i = 0; i < number && coins.size < 24; i++) {
      const coin = document.createElement('span');
      const size = reward.big ? 16 : 11;
      coin.className = 'ash-shard';
      coin.style.cssText = `width:${size}px;height:${size * 1.45}px;`;
      const x = Math.max(8, Math.min(innerWidth - 24, reward.x)), y = Math.max(8, Math.min(innerHeight - 24, reward.y)), rotation = (i % 2 ? -1 : 1) * (13 + i * 17);
      overlay.append(coin); coins.add(coin);
      animate(coin, [
        { transform: `translate(${x}px,${y}px) rotate(${rotation}deg) scale(.7)`, opacity: 0 },
        { transform: `translate(${x + (i - number / 2) * 13}px,${y - 28 - i * 3}px) rotate(${rotation + 22}deg) scale(1)`, opacity: .9, offset: .25 },
        { transform: `translate(${tx - size / 2}px,${ty - size / 2}px) rotate(${rotation + 48}deg) scale(.3)`, opacity: .25 }
      ], { duration: 650, delay: i * 24, easing: 'cubic-bezier(.35,.05,.7,1)', fill: 'both' }, () => {
        coins.delete(coin); coin.remove(); if (i === 0) { bounce(); tone(reward.big, reward.chain); }
      });
    }
  }
  function reward({ x, y, amount, big = false, chain = sequence }) {
    if (disposed || document.hidden || !(amount > 0)) return;
    if (!pending) pending = { x: Number.isFinite(x) ? x : innerWidth / 2, y: Number.isFinite(y) ? y : innerHeight / 2, amount, big, chain };
    else {
      pending.amount += amount;
      if (big) { pending.x = Number.isFinite(x) ? x : pending.x; pending.y = Number.isFinite(y) ? y : pending.y; }
      pending.big ||= big; pending.chain = Math.max(pending.chain, chain);
    }
  }
  function chain(count) {
    sequence = Math.max(1, Number(count) || 1);
    if (sequence < 3 || document.hidden) return;
    label ||= document.createElement('div');
    const viewport = (root.querySelector('.viewport') || root).getBoundingClientRect();
    label.style.cssText = `position:absolute;left:${viewport.left + viewport.width / 2}px;top:${viewport.top + viewport.height * .24}px;transform:translateX(-50%);color:#d5d5d0;font-size:14px;font-weight:600;letter-spacing:.12em;text-shadow:0 2px 5px #121820;white-space:nowrap;`;
    label.textContent = `連鎖 · ${sequence}`;
    overlay.append(label); labelUntil = performance.now() + 900;
  }
  function core({ x = innerWidth / 2, y = innerHeight / 2 } = {}) {
    if (disposed || document.hidden) return;
    tone(true, 1, true);
    if (prefersReduced() || coins.size >= 24) return;
    const halo = document.createElement('span');
    halo.className = 'core-release';
    const px = Math.max(32, Math.min(innerWidth - 32, Number.isFinite(x) ? x : innerWidth / 2));
    const py = Math.max(32, Math.min(innerHeight - 32, Number.isFinite(y) ? y : innerHeight / 2));
    halo.style.cssText = `left:${px - 30}px;top:${py - 30}px;`;
    overlay.append(halo); coins.add(halo);
    animate(halo, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: .7, offset: .2 }, { transform: 'scale(2.2)', opacity: 0 }], { duration: 700, easing: 'ease-out' }, () => { coins.delete(halo); halo.remove(); });
  }
  function tick(now = performance.now()) {
    if (now - lastFlush >= 80) { lastFlush = now; flush(); }
    if (label && now >= labelUntil) { label.remove(); label = undefined; }
  }
  function clear() {
    pending = undefined; sequence = 1;
    for (const oscillator of voices) { try { oscillator.stop(); } catch {} }
    for (const animation of animations) animation.cancel();
    animations.clear();
    for (const coin of coins) coin.remove();
    coins.clear(); label?.remove(); label = undefined;
  }
  function setSound(value) {
    enabled = Boolean(value); paintButton();
    if (enabled) unlock(); else { for (const oscillator of voices) { try { oscillator.stop(); } catch {} } context?.suspend().catch(() => {}); }
  }
  const toggle = () => { setSound(!enabled); onSoundChange(enabled); };
  const visibility = () => { if (document.hidden) { clear(); context?.suspend().catch(() => {}); } else unlock(); };
  button.addEventListener('click', toggle);
  root.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  paintButton();
  function dispose() {
    disposed = true; clear(); button.remove(); overlay.remove();
    button.removeEventListener('click', toggle);
    root.removeEventListener('pointerdown', unlock);
    document.removeEventListener('visibilitychange', visibility);
    context?.close().catch(() => {});
  }
  return { reward, core, chain, tick, unlock, setSound, clear, dispose };
}
