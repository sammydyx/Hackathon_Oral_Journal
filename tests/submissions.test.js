import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { submissionsAPI } from '../submissions-store.js';

test('submission lifecycle persists, deduplicates, validates and isolates task filters',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'oj-submissions-'));
 const start=async()=>{const server=http.createServer((req,res)=>submissionsAPI(req,res,new URL(req.url,'http://localhost'),directory,(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(data));}));await new Promise(r=>server.listen(0,'127.0.0.1',r));return server;};
 let server=await start();let base=()=>`http://127.0.0.1:${server.address().port}/api/submissions`;
 const post=body=>fetch(base(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const payload={studentEmail:'student@oraljournal.demo',studentName:'Student',task:{id:'task-1',question:'Why does ice melt?',knowledgePoints:[{id:'heat',name:'Heat transfer'}]},attempt:{id:'attempt-1',n:1,at:new Date().toISOString(),status:'pending',transcript:'Heat moves into the ice and melts it.'}};
 try {
  assert.equal((await post(payload)).status,201);
  assert.equal((await post(payload)).status,200);
  const graded=structuredClone(payload);graded.attempt.status='graded';graded.attempt.analysis={mentioned:[{pointId:'heat',quote:'Heat moves into the ice'}],missing:[],misconceptions:[],feedback:'Good explanation',mode:'offline'};
  assert.equal((await post(graded)).status,200);
  await post(payload);
  let rows=(await (await fetch(base())).json()).submissions;assert.equal(rows.length,1);assert.equal(rows[0].attempt.status,'graded');
  assert.equal((await post({...payload,attempt:{...payload.attempt,transcript:'Different answer'}})).status,409);
  assert.equal((await post({...payload,studentEmail:'teacher@oraljournal.demo'})).status,400);
  assert.equal((await post({...payload,attempt:{...payload.attempt,id:'invalid',status:'graded'}})).status,400);
  assert.equal((await (await fetch(base()+'?taskId=other')).json()).submissions.length,0);
  const second=structuredClone(payload);second.attempt.id='attempt-2';second.attempt.n=2;second.attempt.status='failed';assert.equal((await post(second)).status,201);
  await new Promise(r=>server.close(r));server=await start();
  rows=(await (await fetch(base())).json()).submissions;assert.equal(rows.length,2);assert.equal(rows.find(r=>r.attempt.id==='attempt-1').attempt.status,'graded');
 } finally {await new Promise(r=>server.close(r));fs.rmSync(directory,{recursive:true,force:true});}
});
