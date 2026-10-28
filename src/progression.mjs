// Purchase prerequisites form a directed acyclic graph; nodes last for one journey.
const branches = [
 [['large','大型弾','砲弾を大型化する',650],['weight','重量増加','砲弾の重量を増やす',1400],['impact','衝撃強化','直撃の威力を上げる',3000],['collapse','倒壊衝撃','瓦礫の衝突威力を上げる',6000]],
 [['blast','爆風拡大','爆風の範囲を広げる',650],['fragments','破片飛散','爆風を強化し、破片で周囲にもダメージ',1600],['ignite','誘爆強化','火薬庫の爆発を強化する',3500],['chain','連鎖破壊','連鎖で解放した刻印片と破壊力を増やす',8500]],
 [['focus','集中砲撃','狙った場所への威力を上げる',700],['cracks','亀裂蓄積','傷んだブロックへの威力を上げる',1700],['double','二連射','一度に二発撃つ',3800],['pierce','貫通弾','砲弾が壁を貫く',7000]],
 [['weak','弱点照準','自動砲撃が傷んだ場所を狙う',750],['foundation','土台優先','自動砲撃が低い支えを狙う',1900],['coordination','砲台連携','砲台が同じ標的を狙う',4500],['salvo','同時斉射','砲台が同時に射撃する',8000]],
 [['treasure','刻印増収','技術装置から得る刻印片を増やす',1000],['advance','時代の収集家','全ての砲弾の爆風威力 ＋15%',12000]],
];
const extra={chain:['collapse'],pierce:['impact'],coordination:['focus'],advance:['chain']};
export const UPGRADES=branches.flatMap((branch,column)=>branch.map(([id,name,description,cost],row)=>Object.freeze({id,name,description,cost,requires:Object.freeze([...(row?[branch[row-1][0]]:[]),...(extra[id]||[])]),x:80+column*155,y:110+row*185}))); 
const nodes=new Map(UPGRADES.map(n=>[n.id,n]));
export function canPurchase(id,owned=[],coins=0){const node=nodes.get(id);return !!node&&!owned.includes(id)&&Number.isFinite(coins)&&coins>=node.cost&&node.requires.every(p=>owned.includes(p));}
export function purchaseUpgrade(id,owned=[],coins=0){if(!canPurchase(id,owned,coins))return null;return {coins:coins-nodes.get(id).cost,owned:[...owned,id]};}
export function effects(owned=[]){return Object.fromEntries(UPGRADES.map(n=>[n.id,owned.includes(n.id)]));}
export function stageScale(stage=1){const tier=Math.floor((Math.max(1,Math.min(10000,Number(stage)||1))-1)/5);return {hp:Math.min(1e12,1.3**tier),reward:Math.min(1e12,1.4**tier)};}
export function rewardForDamage(block,dealt,stage=1){if(!Number.isFinite(dealt)||dealt<=0||!Number.isFinite(block.maxHP)||block.maxHP<=0)return 0;return Math.min(dealt,block.maxHP)/block.maxHP*(3+stage)*stageScale(stage).reward;}
export function shouldAutoAdvance({cleared,elapsed,owned=[],auto,busy}){return !!cleared&&elapsed>=1&&owned.includes('advance')&&!!auto&&!busy;}
