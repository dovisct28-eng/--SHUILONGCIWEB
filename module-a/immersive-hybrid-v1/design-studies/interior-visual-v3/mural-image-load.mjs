export class MuralImageError extends Error{
 constructor(message,{source,cause}={}){super(message,{cause});this.name='MuralImageError';this.source=source;}
}
// A failed decoder can stay in Chrome's image cache; one fresh request permits a real retry.
export async function loadMuralImages(images,source,title,{fetcher=globalThis.fetch,base=globalThis.document?.baseURI,now=Date.now}={}){
 const decode=async src=>{for(const image of images)image.src=src;await Promise.all(images.map(image=>image.decode()));};
 try{await decode(source);return;}catch(cause){
  const url=new URL(source,base);let response;
  try{response=await fetcher(url.href,{method:'HEAD',cache:'no-store',signal:AbortSignal.timeout(2500)});}catch{throw new MuralImageError(`${title}暂未加载，本地网页服务未连接。请重新运行“启动模块A原型”后重试`,{source:url.href,cause});}
  if(!response.ok)throw new MuralImageError(`${title}图片加载失败（HTTP ${response.status}），请确认素材可用后重试`,{source:url.href,cause});
  url.searchParams.set('image-retry',String(now()));try{await decode(url.href);}catch(retryCause){throw new MuralImageError(`${title}图片未能解码，请刷新页面后重试`,{source:url.href,cause:retryCause});}
 }
}
