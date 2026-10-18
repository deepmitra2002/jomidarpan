// Shared, deterministic document policies. No linguistic correction.
export function pdfScale(width,height,dpi=300){return Math.min(dpi/72,4096/Math.max(width,height),Math.sqrt(15990000/(width*height)));}
export function usableText(text,language='auto'){
 const chars=Array.from(text).filter(c=>!(/\s/u.test(c)));
 if(chars.length<12)return false;
 const bad=chars.filter(c=>/[\ufffd\x00-\x08\x0e-\x1f\ue000-\uf8ff]/u.test(c)).length;
 if(bad/chars.length>=.02||layerIssues(text).length)return false;
 return language!=='bn'||/[\u0980-\u09ff]/u.test(text);
}
export function hasSignificantRaster(operators,ops,width,height){
 let m=[1,0,0,1,0,0];const stack=[];let area=0;
 const images=[ops.paintImageXObject,ops.paintInlineImageXObject,ops.paintImageMaskXObject].filter(x=>x!==undefined);
 for(let i=0;i<operators.fnArray.length;i++){
  const op=operators.fnArray[i],a=operators.argsArray[i];
  if(op===ops.save)stack.push(m.slice());
  else if(op===ops.restore)m=stack.pop()||[1,0,0,1,0,0];
  else if(op===ops.transform){const [x,y,z,w,tx,ty]=a;const [p,q,r,s,u,v]=m;m=[p*x+r*y,q*x+s*y,p*z+r*w,q*z+s*w,p*tx+r*ty+u,q*tx+s*ty+v];}
  else if(images.includes(op)){area+=Math.abs(m[0]*m[3]-m[1]*m[2]);}
  else if([ops.paintImageXObjectRepeat,ops.paintImageMaskXObjectRepeat,ops.paintInlineImageXObjectGroup,ops.paintImageMaskXObjectGroup].filter(x=>x!==undefined).includes(op))return true;
 }
 return area>width*height*.15;
}
export function pdfText(items){
 let out='',prev=null;
 for(const item of items){if(typeof item.str!=='string')continue;
  if(prev&&!out.endsWith('\n')){
   const gap=Math.abs(item.transform[5]-prev.transform[5]);
   const fontHeight=Math.max(item.height||12,prev.height||12);
   if(gap>fontHeight*.5)out+='\n'+(gap>Math.max(item.height||12,prev.height||12)*1.8?'\n':'');
   else if(out&&!/\s$/.test(out)&&item.str&&!/^\s/.test(item.str)){const horizontal=item.transform[4]-(prev.transform[4]+prev.width);if(horizontal>fontHeight*.15)out+=horizontal>20?'\t':' ';}
  }
  out+=item.str;if(item.hasEOL)out+='\n';prev=item;
 }
 return out;
}
export function pageResult(result){
 const r={...result,warnings:[...(result.warnings||[])]};
 const readable=(r.text||'').replace(/\[(?:অস্পষ্ট|পরীক্ষা প্রয়োজন|কোনো পাঠযোগ্য লেখা নেই)\]/gu,'').trim();
 r.error=!!r.error||!readable||!!r.truncated;
 if(!readable&&r.text?.trim())r.warnings.push('The model reported no readable transcription. Select a clearer area or transcribe manually.');
 if(!r.text?.trim())r.warnings.push('No readable text returned. This page is not a successful extraction. Check rotation, quality or transcribe it manually.');
 if(r.truncated)r.warnings.push('Incomplete output: the model reached its limit. Use smaller areas and retry.');
 return r;
}
export function exportText(pages){return pages.map((p,i)=>`--- Page ${i+1}${p.extractedRegion?' · selected area only':''} ---\n${p.text||(!p.processed?'[Page not processed]':p.error?'[Processing failed — manual review required]':'')}${p.error&&p.text?'\n[Incomplete or failed extraction — manual review required]':''}`).join('\n\n');}
export function engineForMode(mode,current,backend){
 if(mode==='handwritten')return backend?.providers.local_vlm?'local_vlm':backend?.providers.google?'google':'browser_vlm';
 return backend?.providers.tesseract?'tesseract':'browser';
}
export function estimateSkew(points,width,height){
 if(points.length<250)return 0;
 function score(degrees){const a=degrees*Math.PI/180,s=Math.sin(a),c=Math.cos(a),rows=new Float64Array(Math.ceil(height+width*.3+2)),offset=width*.15;
  for(const [x,y] of points){const row=Math.floor((s*(x-width/2)+c*(y-height/2)+height/2+offset)/2);if(row>=0&&row<rows.length)rows[row]++;}
  let v=0;for(const n of rows)v+=n*n;return v;
 }
 const base=score(0);let best=base,angle=0;
 for(let a=-8;a<=8;a+=.5){const v=score(a);if(v>best){best=v;angle=a;}}
 return best>base*1.3&&Math.abs(angle)<8?angle:0;
}
export function straightenCanvas(canvas){
 const small=document.createElement('canvas');const scale=Math.min(1,600/canvas.width);small.width=Math.max(1,Math.round(canvas.width*scale));small.height=Math.max(1,Math.round(canvas.height*scale));
 const ctx=small.getContext('2d');ctx.drawImage(canvas,0,0,small.width,small.height);const d=ctx.getImageData(0,0,small.width,small.height).data,points=[];
 for(let y=0;y<small.height;y+=2)for(let x=0;x<small.width;x+=2){const i=(y*small.width+x)*4;if(.299*d[i]+.587*d[i+1]+.114*d[i+2]<160)points.push([x,y]);}
 const angle=estimateSkew(points,small.width,small.height);if(!angle)return {canvas,angle:0};
 const a=angle*Math.PI/180,c=document.createElement('canvas');c.width=Math.ceil(Math.abs(canvas.width*Math.cos(a))+Math.abs(canvas.height*Math.sin(a)));c.height=Math.ceil(Math.abs(canvas.height*Math.cos(a))+Math.abs(canvas.width*Math.sin(a)));
 const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.translate(c.width/2,c.height/2);x.rotate(a);x.drawImage(canvas,-canvas.width/2,-canvas.height/2);return {canvas:c,angle};
}
export function readingRegions(page){const regions=[...(page.regions||[])];if(page.crop)regions.push(page.crop);return regions.length?regions:[null];}

export function layerIssues(text){
 const issues=[];
 if(/[\ufffd\x00-\x08\x0e-\x1f\x7f-\x9f\ue000-\uf8ff]/u.test(text))issues.push('Replacement, control or private-use characters in the PDF text layer.');
 if(/[\u0980-\u09ff][\u00c0-\u024f]|[\u00c0-\u024f][\u0980-\u09ff]/u.test(text))issues.push('Unexpected Latin glyphs attached to Bengali characters; possible font mapping corruption.');
 const foreign=(text.match(/\S+/gu)||[]).filter(t=>/[\u00c0-\u024f]/u.test(t)&&!/[A-Za-z]/u.test(t));
 if(/[\u0980-\u09ff]/u.test(text)&&foreign.length>=2)issues.push('Repeated unrelated glyph tokens in Bengali text.');
 if(/[\u0980-\u09ff][0-9=]+[\u0980-\u09ff]|(?:^|\s)[0-9]+[\u0980-\u09ff]/u.test(text))issues.push('Possible digit or symbol intrusion in Bengali words. The original digits are retained in diagnostics.');
 return issues;
}
export function workflowPolicy(mode,imageType='printed'){
 if(!['printed_pdf','handwritten_pdf','image'].includes(mode))throw Error('Unsupported input workflow.');
 return {documentType:mode==='handwritten_pdf'?'handwritten':mode==='printed_pdf'?'printed':imageType==='handwritten'?'handwritten':'printed',accept:mode==='image'?'.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp':'.pdf,application/pdf'};
}
