import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../student.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('let voiceDraft ='),html.indexOf('// ---------- Submit ----------'));
const stop=html.slice(html.indexOf('function stopRecording()'),html.indexOf('function restoreTask()'));
function harness(getMedia){
 const elements=new Map();let recognition,stopped=0;
 const $=id=>{if(!elements.has(id))elements.set(id,{textContent:'',value:'en-US',classList:{toggle(){}},getContext:()=>({clearRect(){},fillRect(){}})});return elements.get(id);};
 class Speech{constructor(){recognition=this;}start(){}stop(){}abort(){}}
 class Audio{resume(){return Promise.resolve();}close(){return Promise.resolve();}createAnalyser(){return {getByteTimeDomainData:a=>a.fill(128)};}createMediaStreamSource(){return {connect(){}};}}
 const stream={getTracks:()=>[{stop:()=>stopped++}]};
 const context=vm.createContext({$,window:{SpeechRecognition:Speech,AudioContext:Audio},navigator:{mediaDevices:{getUserMedia:getMedia||(()=>Promise.resolve(stream))}},task:{id:'t'},persistTask(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},Uint8Array,Date});
 vm.runInContext(source+stop,context);
 return {$,stream,context,get rec(){return recognition;},get stopped(){return stopped;},read:()=>vm.runInContext('voiceDraft',context),stop:()=>vm.runInContext('stopRecording()',context)};
}
test('recording hides transcript, waits for final recognition and releases microphone',async()=>{
 const h=harness();await h.$('recBtn').onclick();assert.equal(h.$('analyzeBtn').disabled,true);
 await h.$('recBtn').onclick();assert.equal(h.$('recBtn').disabled,true);
 const result=[{transcript:'My spoken explanation covers the same whole.'}];result.isFinal=true;
 h.rec.onresult({results:[result]});assert.match(h.read(),/spoken explanation/);assert.doesNotMatch(h.$('voiceState').textContent,/spoken explanation/);
 h.rec.onend();assert.equal(h.$('analyzeBtn').disabled,false);assert.equal(h.stopped,1);
});
test('leaving while microphone permission is pending stops late media stream',async()=>{
 let resolve;const h=harness(()=>new Promise(r=>resolve=r));const pending=h.$('recBtn').onclick();h.stop();resolve(h.stream);await pending;assert.equal(h.stopped,1);assert.equal(h.rec,undefined);
});
test('microphone denial keeps submit disabled and explains recovery',async()=>{
 const h=harness(()=>Promise.reject(Object.assign(Error(),{name:'NotAllowedError'})));await h.$('recBtn').onclick();assert.equal(h.$('analyzeBtn').disabled,true);assert.match(h.$('voiceState').textContent,/denied/);
});
