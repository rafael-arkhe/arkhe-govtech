import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const data=mkdtempSync(join(tmpdir(),'govtech-http-'));
const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
const base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['scripts/serve.mjs','start'],{env:{...process.env,PORT:String(port),GOVTECH_ORIGIN:base,GOVTECH_DATA_DIR:data},stdio:['ignore','pipe','pipe'],windowsHide:true});
let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
try{
  let ready=false;for(let i=0;i<80;i++){try{ready=(await fetch(base+'/api/ready')).ok;}catch{}if(ready)break;await new Promise(r=>setTimeout(r,250));}
  assert.ok(ready,'Production server did not become ready');
  assert.ok((await fetch(base+'/')).ok);assert.ok((await fetch(base+'/govtech/offline.html')).ok);
  assert.equal((await fetch(base+'/api/govtech')).status,401);
  const accounts=JSON.parse(readFileSync(join(data,'credentials.json')));
  const result=await fetch(base+'/api/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(accounts.find(a=>a.email.startsWith('owner@')))});
  assert.equal(result.status,200);const cookie=result.headers.get('set-cookie').split(';')[0];
  const state=await fetch(base+'/api/govtech',{headers:{Cookie:cookie}});assert.equal(state.status,200);const value=await state.json();assert.equal(value.mode,'synthetic');assert.equal(value.user.role,'owner');assert.equal(value.cases.length,0);
  const blocked=await fetch(base+'/api/govtech/settings',{method:'POST',headers:{Origin:'https://invalid.example',Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({action:'stop',stopped:true,revision:1})});assert.equal(blocked.status,403);
  assert.equal((await fetch(base+'/api/logout',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:'{}'})).status,200);
  assert.equal((await fetch(base+'/api/me',{headers:{Cookie:cookie}})).status,401);
  console.log('PASS: production HTTP, HTML, offline asset, authentication, session, fresh DB and CSRF.');
}catch(error){console.error(error.message);console.error(logs.slice(-2500));process.exitCode=1;}
finally{child.kill('SIGTERM');}
