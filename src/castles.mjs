import {MATERIALS} from './collision.mjs?v=10';
export const CASTLE_TYPES=[
 {id:'fortress',name:'石造りの砦'},
 {id:'fairytale',name:'おとぎの城'},
 {id:'basilica',name:'尖塔の聖堂'},
 {id:'keep',name:'白壁の天守'},
 {id:'citadel',name:'城壁都市'}
];
export function castleBlueprint(stage=1){
 const type=CASTLE_TYPES[((Math.max(1,stage)-1)%5)],cells=new Map(),flags=[];let building='wall';
 const put=(x,r,z,tone='stone',kind='brick')=>{const key=[x,r,z].join(':');if(!cells.has(key))cells.set(key,{x,y:r*.79+.4,z,tone,kind,buildingId:building});return key};
 const column=(x,z,height,tone='stone',roof=false)=>{building='tower:'+x+':'+z;for(let r=0;r<height;r++)put(x,r,z,tone);let key=[x,height-1,z].join(':');if(roof){key=put(x,height-.02,z,tone==='sand'?'sand':'blue','cone');const cap=cells.get(key);cap.y=(height-1)*.79+.4+.38+.9}return key};
 const wall=(x1,x2,z,height,tone='stone',gate=false)=>{building='wall:'+z;for(let x=x1;x<=x2;x++)for(let r=0;r<height;r++){if(gate&&x===0&&r<2)continue;put(x,r,z,tone)}};
 const box=(x1,x2,z1,z2,height,tone='stone')=>{building='building:'+x1+':'+z1;for(let x=x1;x<=x2;x++)for(let z=z1;z<=z2;z++)for(let r=0;r<height;r++){if(x===x1||x===x2||z===z1||z===z2)put(x,r,z,tone)}};
 if(type.id==='fortress'){
  wall(-4,4,-2.5,4,'stone',true);wall(-4,4,-7.5,4);
  for(const x of [-4,4])for(let z=-6.5;z<=-3.5;z++)column(x,z,4);
  for(const x of [-4,4])for(const z of [-2.5,-7.5])flags.push(column(x,z,7));
  box(-1,1,-5.5,-3.5,2,'terracotta');
  for(let x=-3;x<=3;x+=2){put(x,4,-2.5);put(x,4,-7.5)}
 }else if(type.id==='fairytale'){
  // A broad palace and many blue pointed roofs, dominated by a tall central tower.
  box(-2,2,-6.5,-3.5,4,'rose');wall(-4,4,-2.5,3,'ivory',true);
  for(const x of [-4,4])flags.push(column(x,-2.5,6,'ivory',true));
  for(const x of [-3,3])flags.push(column(x,-6.5,7,'rose',true));
  for(const x of [-1,0,1])column(x,-5.5,8,'ivory',x!==0);
  flags.push(column(0,-5.5,10,'ivory',true));
 }else if(type.id==='basilica'){
  // Sagrada Familia-inspired skyline: a dense cluster of slender uneven spires.
  box(-3,3,-6.5,-3.5,3,'sand');wall(-3,3,-2.5,3,'sand',true);
  for(const x of [-3,-1,1,3])column(x,-2.5,x===-1||x===1?8:6,'sand',true);
  for(const x of [-3,-1,1,3])column(x,-6.5,x===-1||x===1?9:7,'sand',true);
  flags.push(column(0,-4.5,12,'sand',true));
  for(const x of [-2,2])column(x,-4.5,9,'sand',true);
 }else if(type.id==='keep'){
  // Three stepped white storeys, dark eaves, and a small top keep.
  for(let x=-3;x<=3;x++)for(let z=-6.5;z<=-2.5;z++){for(let r=0;r<3;r++)put(x,r,z,'ivory');put(x,3,z,'slate')}
  for(let x=-2;x<=2;x++)for(let z=-5.5;z<=-3.5;z++){put(x,4,z,'ivory');put(x,5,z,'slate')}
  for(const x of [-1,0,1])for(const z of [-5.5,-4.5,-3.5]){put(x,6,z,'ivory');put(x,7,z,'slate')}
  flags.push(put(0,8,-4.5,'gold'));
 }else{
  // A walled city, separate buildings and a high watchtower.
  wall(-4,4,-2.5,3,'brick',true);wall(-4,4,-7.5,3,'brick');
  for(const x of [-4,4])for(let z=-6.5;z<=-3.5;z++)column(x,z,3,'brick');
  for(const x of [-4,4])for(const z of [-2.5,-7.5])flags.push(column(x,z,5,'brick'));
  for(const x of [-2,1]){box(x,x+1,-6.5,-4.5,4,'ivory');for(let xx=x;xx<=x+1;xx++)for(let z=-6.5;z<=-4.5;z++)put(xx,4,z,'terracotta')}
  flags.push(column(0,-3.5,7,'brick',true));
 }
 // The two stores sit behind the front wall, not in the turret placement area.
 const store=(x,z,role,tone)=>{const key=[x,0,z].join(':');if(!cells.has(key)){building='store:'+role;put(x,0,z,tone)}const cell=cells.get(key);cell.role=role;cell.tone=tone;cell.buildingId='store:'+role;};
 store(0,-3.5,'treasure','gold');store(1,-5.5,'powder','powder');
 building='barracks';for(let r=0;r<2;r++){const key=put(-2,r,-4.5,'slate');const cell=cells.get(key);cell.buildingId='barracks';if(r===0)cell.role='barracks';}

 const blocks=[...cells.entries()].map(([key,cell])=>{
  const material=cell.role?'wood':cell.kind==='cone'||cell.tone==='terracotta'?'wood':['rose','brick'].includes(cell.tone)?'brick':'stone';
  return {key,...cell,material,maxHP:MATERIALS[material].hp,mass:MATERIALS[material].mass*(cell.kind==='cone'?.65:1)};
 });
 return {type,blocks,flags,maxHeight:Math.max(...blocks.map(b=>b.y+(b.kind==='cone'?.9:.38)))};
}
