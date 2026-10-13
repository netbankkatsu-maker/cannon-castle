/** Cosmetic rewards: currency accounting always belongs to the game. */
export function createFeedback({ root, money, reduced = false, sound = true, onSoundChange = () => {} }) {
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden;';
  document.body.append(overlay);
  const button = document.createElement('button');
  button.type = 'button';
  button.style.cssText = 'flex:0 0 44px;width:44px;min-height:44px;padding:0;border:1px solid #54657a;background:#172437;color:#ffdf8c;font-size:18px;border-radius:12px;';
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
  function tone(big, count) {
    if (!enabled || document.hidden || !context || context.state !== 'running' || activeVoices >= 6) return;
    const notes = big || count >= 12 ? [0, 4, 7] : count >= 6 ? [0, 4] : [0];
    for (const interval of notes) {
      if (activeVoices >= 6) break;
      try {
        const oscillator = context.createOscillator(), gain = context.createGain();
        const at = context.currentTime, frequency = 440 * 2 ** ((Math.min(12, Math.max(0, count - 1)) + interval) / 12);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(notes.length > 1 ? 0.027 : 0.045, at + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
        oscillator.connect(gain); gain.connect(context.destination);
        activeVoices++; voices.add(oscillator);
        oscillator.onended = () => { activeVoices = Math.max(0, activeVoices - 1); voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at); oscillator.stop(at + 0.18);
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
    moneyAnimation = animate(money, [{ transform: 'scale(1)' }, { transform: 'scale(1.09)' }, { transform: 'scale(1)' }], { duration: 190 });
  }
  function flush() {
    if (!pending || disposed || document.hidden) return;
    const reward = pending; pending = undefined;
    if (prefersReduced()) { tone(reward.big, reward.chain); return; }
    const target = money.getBoundingClientRect();
    const tx = target.left + target.width / 2, ty = target.top + target.height / 2;
    const number = reward.big ? 7 : 3;
    for (let i = 0; i < number && coins.size < 24; i++) {
      const coin = document.createElement('span');
      const size = reward.big ? 19 : 13;
      coin.textContent = '✦';
      coin.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;display:grid;place-items:center;border-radius:50%;border:1px solid #fff0aa;background:#efb940;color:#fff3bc;font-size:${size - 4}px;box-shadow:0 0 8px #ffd65b99;`;
      const x = Math.max(8, Math.min(innerWidth - 24, reward.x)), y = Math.max(8, Math.min(innerHeight - 24, reward.y));
      overlay.append(coin); coins.add(coin);
      animate(coin, [
        { transform: `translate(${x}px,${y}px) scale(.7)`, opacity: 0 },
        { transform: `translate(${x + (i - number / 2) * 13}px,${y - 28 - i * 3}px) scale(1)`, opacity: 1, offset: .25 },
        { transform: `translate(${tx - size / 2}px,${ty - size / 2}px) scale(.5)`, opacity: 1 }
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
    label.style.cssText = `position:absolute;left:${viewport.left + viewport.width / 2}px;top:${viewport.top + viewport.height * .24}px;transform:translateX(-50%);color:#fff0a8;font-size:22px;font-weight:900;text-shadow:0 2px 5px #422700;white-space:nowrap;`;
    label.textContent = `${sequence} 連鎖！`;
    overlay.append(label); labelUntil = performance.now() + 900;
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
  return { reward, chain, tick, unlock, setSound, clear, dispose };
}
