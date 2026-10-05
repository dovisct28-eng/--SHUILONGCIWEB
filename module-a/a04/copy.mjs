export const introCopy={title:'三铺之间',description:'从第五铺出发，沿侧廊抵达第一铺，再返回主殿中的第二铺。',boundary:'路线为本项目的数字观看设计，用于理解三铺壁画在建筑中的空间关系。'};
export function caption(sample,mode,handoff=false){
  if(handoff)return {number:'⑤',title:'从第五铺开始',description:'继续向下，进入壁画'};
  if(mode==='idle')return {number:'',title:'三铺之间',description:introCopy.description};
  if(mode==='completed'||sample.phase===4)return {number:'',title:'三铺，一条观看路径',description:'第五铺 → 第一铺 → 第二铺'};
  return [
    {number:'01',title:'第五铺',description:'从这里出发'},
    {number:'02',title:'前往第一铺',description:'沿侧廊前行'},
    {number:'03',title:'返回第二铺',description:'回到主殿'},
    {number:'',title:'',description:''},
  ][sample.phase];
}
