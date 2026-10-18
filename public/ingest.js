import {parseCSV} from './csv.js';
import {extractFields} from './extraction.js';
export const fields=['owner','previous_owner','district','upazila','mouza','survey','khatian','plot','area','unit','seller_share','deed_number','deed_date','registration_date','previous_deed','previous_deed_date','mutation_status','tax_year','tax_status','jl','classification'];
export function pdfLines(items){
 const lines=[];
 for(const i of items){if(!i.str?.trim())continue;const y=i.transform?.[5]??0;let line=lines.find(l=>Math.abs(l.y-y)<1.8);if(!line){line={y,items:[]};lines.push(line)}line.items.push(i)}
 return lines.sort((a,b)=>b.y-a.y).map(l=>l.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str).join(' ')).join('\n');
}
export function fromPages(pages){
 const found=extractFields(pages);const values={},provenance={},conflicts=[];
 for(const c of found){if(values[c.field]!==undefined && values[c.field]!==c.extracted_value){conflicts.push(c.field);continue}values[c.field]=c.extracted_value;provenance[c.field]=`PDF · পৃষ্ঠা ${c.page}${c.method==='ocr'?' · OCR':''}`;}
 return {values,provenance,conflicts:[...new Set(conflicts)]};
}
export function fromCSV(text){
 const rows=parseCSV(text.replace(/^\uFEFF/,''));
 if(rows.length!==1)throw new Error('একটি CSV-তে ঠিক একটি বিক্রেতার তথ্য থাকতে হবে। ৫০০ রেকর্ডের ফাইলটি এখানে আপলোড করবেন না।');
 const row=rows[0],values={},provenance={};
 if(!fields.some(k=>Object.hasOwn(row,k)))throw new Error('CSV কলাম চেনা যায়নি। পরীক্ষার একটি CSV বা একই কলামের টেমপ্লেট ব্যবহার করুন।');
 for(const k of [...fields,'baseline_record_id','registry_office','registry_book','registry_page'])if(Object.hasOwn(row,k)){values[k]=String(row[k]);provenance[k]=`CSV · সারি 2 · ${k}`;}
 return {values,provenance,conflicts:[]};
}
