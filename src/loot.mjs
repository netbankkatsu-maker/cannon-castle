import {RELICS} from './relics.mjs?v=13';
export function createLoot({root,onChoose}){
 const dialog=document.createElement('dialog');dialog.className='loot-dialog';dialog.setAttribute('aria-labelledby','loot-title');
 dialog.innerHTML='<h2 id="loot-title">時代の遺物</h2><p>ひとつ選び、次の城へ。効果はこの旅の間だけ。</p><div class="loot-cards"></div>';
 root.append(dialog);dialog.addEventListener('cancel',e=>e.preventDefault());
 return {open(ids){const cards=dialog.querySelector('.loot-cards');cards.replaceChildren();for(const id of ids){const relic=RELICS.find(r=>r.id===id),button=document.createElement('button');button.type='button';button.className='loot-card';button.innerHTML=`<b>${relic.name}</b><span class="benefit">恩恵 · ${relic.benefit}</span><span class="drawback">代償 · ${relic.drawback}</span>`;button.addEventListener('click',()=>onChoose(id));cards.append(button);}if(!dialog.open)dialog.showModal();},close(){if(dialog.open)dialog.close();},dispose(){dialog.remove();}};
}
