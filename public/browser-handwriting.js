let worker,pending=null,sequence=0;
export function stopHandwriting(message='Handwriting stopped.'){
 if(worker){worker.terminate();worker=null;}
 if(pending){const p=pending;pending=null;clearTimeout(p.timer);p.reject(new Error(message));}
}
export function readHandwriting(canvas,onProgress,{timeoutMs=900000,language='mixed'}={}){
 if(pending)return Promise.reject(new Error('A handwriting task is already running.'));
 if(!worker){
  worker=new Worker(new URL('./handwriting-worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{
   if(!pending||data.id!==pending.id)return;
   if(data.event==='progress'){pending.onProgress(data.message);return;}
   const p=pending;pending=null;clearTimeout(p.timer);
   if(data.event==='result')p.resolve(data);
   else p.reject(new Error(data.message));
  };
  worker.onerror=e=>{const p=pending;pending=null;clearTimeout(p?.timer);worker?.terminate();worker=null;p?.reject(new Error(e.message||'Could not load the browser handwriting engine. Check your connection.'));};
 }
 const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 return new Promise((resolve,reject)=>{pending={id:++sequence,resolve,reject,onProgress,timer:setTimeout(()=>stopHandwriting('Handwriting model timed out. Try a smaller area or check your GPU and connection.'),timeoutMs)};worker.postMessage({id:sequence,pixels:pixels.buffer,language,width:canvas.width,height:canvas.height},[pixels.buffer]);});
}
export function regionCanvas(source,region){
 const c=document.createElement('canvas'),r=region||{x:0,y:0,w:1,h:1};
 const width=Math.max(1,Math.round(source.width*r.w)),height=Math.max(1,Math.round(source.height*r.h));
 const scale=Math.min(1,1280/Math.max(width,height));c.width=Math.max(1,Math.round(width*scale));c.height=Math.max(1,Math.round(height*scale));
 c.getContext('2d').drawImage(source,source.width*r.x,source.height*r.y,width,height,0,0,c.width,c.height);return c;
}
