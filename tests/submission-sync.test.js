import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../submission-sync.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function boot(storage,fetch) {
 const events={},status={setAttribute(){}},prefix='student:';
 const context={OralJournal:{read:()=>({role:'student',email:'student@oraljournal.demo'})},OJWork:{prefix},
  document:{createElement:()=>status,getElementById:id=>id==='name'?{value:'Test'}:{after(){}}},
  localStorage:{get length(){return storage.size;},key:i=>[...storage.keys()][i],getItem:key=>storage.get(key)},
  fetch,AbortSignal,Date,JSON,Map,Set,setInterval:()=>{},window:{OJWork:{prefix},addEventListener:(name,fn)=>events[name]=fn}};
 vm.runInNewContext(source,context);return {events,status};
}
test('drafts stay private and failed requests recover after reopening',async()=>{
 const work={task:{id:'t'},draft:'Private draft',attempts:[]},storage=new Map([['student:t',JSON.stringify(work)]]);let calls=[];
 let app=boot(storage,async(_,options)=>{calls.push(JSON.parse(options.body));throw Error('offline');});await tick();assert.equal(calls.length,0);
 work.attempts.push({id:'a',status:'pending',transcript:'Submitted answer'});storage.set('student:t',JSON.stringify(work));app.events['oj-work-saved']({detail:{id:'t',work}});await tick();
 assert.equal(calls.length,1);assert.equal(calls[0].draft,undefined);assert.match(app.status.textContent,/pending/);
 calls=[];app=boot(storage,async(_,options)=>{calls.push(JSON.parse(options.body));return {ok:true};});await tick();
 assert.equal(calls.length,1);assert.match(app.status.textContent,/synced/);
 app.events.focus();await tick();assert.equal(calls.length,1);
});
test('feedback arriving during upload is delivered after pending snapshot',async()=>{
 const work={task:{id:'t'},attempts:[{id:'a',status:'pending',transcript:'Answer'}]},storage=new Map([['student:t',JSON.stringify(work)]]);let release,calls=[];
 const app=boot(storage,async(_,options)=>{calls.push(JSON.parse(options.body));if(calls.length===1)await new Promise(r=>release=r);return {ok:true};});
 work.attempts[0].status='graded';app.events['oj-work-saved']({detail:{id:'t',work}});release();await tick();
 assert.deepEqual(calls.map(c=>c.attempt.status),['pending','graded']);assert.match(app.status.textContent,/synced/);
});
