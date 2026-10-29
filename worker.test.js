import test from 'node:test';import assert from 'node:assert/strict';import worker,{predict} from '../src/worker.js';
const cases=[[1,1],[20,128],[50,512],[75,900],[100,1024]];
for(const [concurrent_requests,payload_kb] of cases)test('valid '+concurrent_requests+'/'+payload_kb,()=>{const r=predict({concurrent_requests,payload_kb});assert.equal(r.status,200);assert.equal(r.body.model_version,'1.0.0');assert.ok(Number.isFinite(r.body.prediction_ms))});
for(const [name,body] of [['missing',{concurrent_requests:10}],['wrong type',{concurrent_requests:'10',payload_kb:20}],['range',{concurrent_requests:101,payload_kb:20}],['shape',[10,20]],['extra',{concurrent_requests:10,payload_kb:20,other:1}]])test('invalid '+name,()=>assert.equal(predict(body).status,400));
test('malformed JSON',async()=>{const r=await worker.fetch(new Request('https://example.test/api/predict',{method:'POST',headers:{'content-type':'application/json'},body:'{oops'}),{});assert.equal(r.status,400);assert.equal((await r.json()).error.code,'INVALID_JSON')});
test('health',async()=>{const r=await worker.fetch(new Request('https://example.test/api/health'),{});assert.equal(r.status,200)});
