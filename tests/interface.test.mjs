import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
const w=new Window({url:'https://jomi.test/studio.html',width:1200,height:850});
w.document.body.innerHTML='<div id="app"></div><div id="toast"></div>';
w.HTMLElement.prototype.scrollIntoView=function(){};
w.scrollTo=()=>{};
for(const name of ['window','document','location','localStorage','matchMedia','requestAnimationFrame','cancelAnimationFrame'])Object.defineProperty(globalThis,name,{value:typeof w[name]==='function'?w[name].bind(w):w[name],configurable:true});
Object.defineProperty(globalThis,'speechSynthesis',{value:undefined,configurable:true});
const requests=[];
globalThis.fetch=async(path,options)=>{if(path==='/api/status')return Response.json({count:500,user:null});if(path==='/api/assistant'){requests.push(JSON.parse(options.body));return Response.json({text:'<script>alert("x")</script> এটি শুধু ব্যাখ্যা।'})}throw new Error('Unexpected request '+path)};
await import('../public/studio.js');await new Promise(r=>setTimeout(r,10));
const click=s=>{const element=document.querySelector(s);assert(element,s);element.click()};
test('Bangla branding, mobile controls and complete cross-tab tour',async()=>{
 assert(document.querySelector('.brand').textContent.includes('জমিদর্পণ'));
 assert(document.querySelector('img[src="/bd-flag.svg"]'));
 assert.equal(document.querySelectorAll('.bottom-nav a').length,5);
 click('#phone-view');assert(document.body.classList.contains('phone-preview'));assert.equal(document.querySelector('#phone-view').getAttribute('aria-pressed'),'true');
 click('#phone-view');assert(!document.body.classList.contains('phone-preview'));
 click('#quick-tour');assert.equal(document.querySelector('#tour-title').textContent,'জমিদর্পণে স্বাগতম');
 const expected=['verify','verify','verify','files','files','crime','assistant','guidance'];
 for(const page of expected){click('#tour-next');assert.equal(location.hash,'#'+page);assert(document.querySelector('#tour-card[role="dialog"]'));}
 click('#tour-next');assert.equal(location.hash,'#home');assert(!document.querySelector('#tour-layer'));
 click('#quick-tour');w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert(!document.querySelector('#tour-layer'));
});
test('AI form is explicit, keeps answers as text, and retains offline guidance',async()=>{
 location.hash='#assistant';w.dispatchEvent(new w.HashChangeEvent('hashchange'));
 const input=document.querySelector('#ai-question');assert(input);input.value='খতিয়ান কী?';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 document.querySelector('#ai-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await new Promise(r=>setTimeout(r,10));assert.equal(requests.length,1);assert.equal(requests[0].question,'খতিয়ান কী?');
 assert(document.querySelector('.from-ai').textContent.includes('<script>'));
 assert.equal(document.querySelectorAll('.from-ai script').length,0);
 assert(document.querySelector('.offline-guidance'));
 click('[data-answer="0"]');assert(document.querySelector('#answer').textContent.includes('পরিচয়'));
 await w.happyDOM.abort();
});
