import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerQuestion,cleanQuestion,safeSummary,providerError} from '../lib/ai/assistant.ts';
test('Server Gemini provider uses secret header and bounded plain-text output',async()=>{
 let request;
 const mock=async(url,init)=>{request={url:String(url),headers:new Headers(init.headers),body:JSON.parse(init.body)};return Response.json({candidates:[{content:{role:'model',parts:[{text:'মূল নথির তথ্য মিলিয়ে দেখুন।'}]},finishReason:'STOP'}],usageMetadata:{promptTokenCount:10,candidatesTokenCount:10,totalTokenCount:20}})};
 const result=await answerQuestion({key:'test-only-secret',model:'gemini-3.8-flash',baseURL:'https://generativelanguage.googleapis.com/v1beta'},'খতিয়ান কী?','bn',{matched:20,different:1,missing:0,attention_fields:['owner'],owner:'must not be sent',record_id:'must not be sent'},mock);
 assert.equal(result,'মূল নথির তথ্য মিলিয়ে দেখুন।');
 assert.equal(request.headers.get('x-goog-api-key'),'test-only-secret');assert(!request.url.includes('test-only-secret'));
 assert(!JSON.stringify(request.body).includes('must not be sent'));
 assert.equal(request.body.generationConfig.maxOutputTokens,1100);assert.equal(request.body.generationConfig.thinkingConfig.thinkingBudget,0);assert(!request.body.generationConfig.thinkingConfig.thinkingLevel);
 assert(request.body.systemInstruction.parts.some(p=>p.text.includes('cannot change')));
});
test('Question and summary validation prevent accidental private-ID forwarding',()=>{
 assert.equal(cleanQuestion(' খতিয়ান কী? '),'খতিয়ান কী?'.normalize('NFC'));
 assert.throws(()=>cleanQuestion('NID 1234567890123'));
 assert.throws(()=>cleanQuestion('আমার ফোন ০১৭১২৩৪৫৬৭৮'));
 assert.throws(()=>cleanQuestion('abc@example.com'));
 assert.throws(()=>cleanQuestion('a'.repeat(801)));
 assert.deepEqual(safeSummary({matched:21,different:-1,missing:500,attention_fields:['owner','<script>','api_key'],owner:'Name'}),{matched:21,different:0,missing:0,attention_fields:['owner']});
});
test('Provider errors expose useful status without raw provider response or secrets',()=>{
 const error=providerError({statusCode:403,responseBody:'{"reason":"SERVICE_DISABLED","key":"sensitive"}'});
 assert.equal(error.code,'PROVIDER_DISABLED');assert(!JSON.stringify(error).includes('sensitive'));
 assert.equal(providerError({statusCode:429}).status,429);
});
