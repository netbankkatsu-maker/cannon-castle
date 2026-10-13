const line=(speaker,text)=>({speaker,text,portrait:speaker==='灰の人'?'wanderer':'soul'});
export const STORY=Object.freeze({
 intro:[line('灰の人','明日、この世界は崩れる。私は、その音を一度聞いている。'),line('灰の人','名前は思い出せない。ただ、あの城へ行かなければならないことだけは分かる。'),line('記憶の魂','城の中に、君の失くしたものがある。壁を崩せば、少しずつ戻ってくるよ。')],
 departureFirst:[line('灰の人','持ってきた弾は、これだけだ。高い塔より先に、足元を狙おう。'),line('記憶の魂','兵舎が残っている間は、向こうも撃ってくる。大砲が壊れる前に帰るんだ。'),line('灰の人','誰も旗を掲げていない。それでも、私を待っていたように砲口が動く。')],
 firstClear:[line('灰の人','瓦礫の中に、三つの刻印が浮かんでいる。どれも、どこかで見た気がする。'),line('記憶の魂','一つだけ持っていける。力は増すけれど、必ず何かを差し出すことになる。')],
 firstReturn:[line('灰の人','帰ってくると、城で得た力が消えた。残っているのは、この魂だけだ。'),line('記憶の魂','祭壇に捧げよう。大砲も、灰の器も、次の旅へ残せる。'),line('灰の人','城で育てた強化は、また最初から。それなのに、手だけは壊し方を覚えている。')],
 altarFirst:[line('灰の人','祭壇に触れると、手の傷がひとつ消えた。代わりに、知らない傷跡が現れた。'),line('記憶の魂','前より遠くまで行ける。それだけ覚えていればいい。')],
 day2:[line('灰の人','二日目の城にも、人の暮らした気配がない。食卓の蝋燭だけが、まだ温かい。'),line('記憶の魂','兵たちは、誰の合図もなく動いている。城の仕掛けと、つながっているのかもしれない。')],
 day3:[line('灰の人','砲撃の合間に、私の名前を呼ぶ声がした。崩れた兵舎の方から。'),line('記憶の魂','聞き違いだよ。君には、まだ名前がない。'),line('灰の人','「まだ」。その言い方が、胸に残った。')],
 day5:[line('灰の人','五日目。城壁の内側に、こちらの大砲と同じ傷跡を見つけた。'),line('灰の人','世界が崩れる音は、空から聞こえたのではない。ここから、響いていた。'),line('記憶の魂','……先へ行こう。思い出す順番を、間違えてはいけない。')],
 day10:[line('灰の人','十日目。無人の広間で、崩したはずの壁が組み上がっていく。その奥に、私の筆跡があった。'),line('灰の人','「城を残すな。次の私が、目を覚ます前に。」'),line('記憶の魂','君は、世界を救うために戻ってきた。それは本当だ。'),line('灰の人','では、なぜ兵たちは私を止める。なぜ、お前の声だけが崩れない。'),line('記憶の魂','答えは、もう少し奥にある。……今度こそ、最後まで行こう。'),line('灰の人','書き置きの最後に、短い言葉があった。「明日へ帰れ」。'),line('記憶の魂','器に残った灰が、明日を繋いでいる。君のいた未来は、もう一度だけ朝を迎えられる。'),line('灰の人','それが本当か、私には分からない。それでも、消えていた空に一筋の光が戻った。')],
});
export function createStory({root,onPause=()=>{},onResume=()=>{},portraits={},getSeen=()=>[],onSeen=()=>{}}){
 const dialog=document.createElement('dialog');dialog.className='story-dialog';dialog.setAttribute('aria-labelledby','story-speaker');
 dialog.innerHTML='<div class="story-content"><img class="story-portrait" alt=""><div class="story-copy"><b id="story-speaker"></b><p class="story-text" aria-live="polite"></p></div></div><div class="story-actions"><button type="button" data-story-skip>読み飛ばす</button><button type="button" data-story-next>次へ</button></div>';
 root.append(dialog);const img=dialog.querySelector('img'),speaker=dialog.querySelector('b'),text=dialog.querySelector('p'),next=dialog.querySelector('[data-story-next]');let active=null,index=0,disposed=false;const queue=[],seen=new Set(getSeen());
 img.addEventListener('error',()=>{img.hidden=true;});
 function paint(){const entry=STORY[active][index];speaker.textContent=entry.speaker;text.textContent=entry.text;img.hidden=false;img.src=portraits[entry.portrait]||(entry.portrait==='wanderer'?'/assets/ash-wanderer.webp':'/assets/memory-soul.webp');next.textContent=index===STORY[active].length-1?'閉じる':'次へ';}
 function begin(id){active=id;index=0;seen.add(id);onSeen(id);paint();if(!dialog.open)dialog.showModal();next.focus();}
 function play(id){if(disposed||!Object.hasOwn(STORY,id)||seen.has(id)||getSeen().includes(id)||queue.includes(id)||active===id)return false;if(active){queue.push(id);return true;}onPause();begin(id);return true;}
 function finish(){if(!active)return;if(queue.length){begin(queue.shift());return;}active=null;dialog.close();onResume();}
 next.addEventListener('click',()=>{if(!active)return;if(index+1<STORY[active].length){index++;paint();}else finish();});dialog.querySelector('[data-story-skip]').addEventListener('click',finish);
 dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
 return {play,close(){queue.length=0;finish();},get isOpen(){return !!active;},dispose(){disposed=true;queue.length=0;if(active){active=null;dialog.close();onResume();}dialog.remove();}};
}
