import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
process.env.GOVTECH_DATA_DIR=mkdtempSync(join(tmpdir(),'govtech-auth-'));
process.env.GOVTECH_ORIGIN='https://govtech.example';
execFileSync(process.execPath,['scripts/setup.mjs'],{stdio:'pipe'});
const {handle}=await import('../lib/http.mjs');
const credentials=JSON.parse(readFileSync(join(process.env.GOVTECH_DATA_DIR,'credentials.json')));
const request=(path,{method='GET',value,cookie='',origin=process.env.GOVTECH_ORIGIN,type='application/json',raw}={})=>handle(new Request(process.env.GOVTECH_ORIGIN+'/api/'+path,{method,headers:{Origin:origin,Cookie:cookie,'Content-Type':type},...(method==='GET'?{}:{body:raw??JSON.stringify(value)})}),path.split('/'));
test('public probes, unknown methods and private state are separated',async()=>{
 assert.equal((await request('health')).status,200);assert.equal((await request('ready')).status,200);assert.equal((await request('govtech')).status,401);assert.equal((await request('me',{method:'DELETE',raw:'{}'})).status,405);
});
test('JSON parser rejects media type, malformed objects and oversized requests',async()=>{
 assert.equal((await request('login',{method:'POST',raw:'{}',type:'text/plain'})).status,415);
 for(const raw of ['{','[]','null'])assert.equal((await request('login',{method:'POST',raw})).status,400);
 assert.equal((await request('login',{method:'POST',raw:JSON.stringify({data:'x'.repeat(270000)})})).status,413);
});
test('secure session cookie, no-store, unknown routes and logout',async()=>{
 const r=await request('login',{method:'POST',value:credentials.find(c=>c.email.startsWith('reviewer@'))});assert.equal(r.status,200);
 const full=r.headers.get('set-cookie'),cookie=full.split(';')[0];assert.match(full,/HttpOnly/);assert.match(full,/SameSite=Strict/);assert.match(full,/; Secure/);assert.match(full,/govtech_session=/);assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal((await request('me',{cookie})).status,200);assert.equal((await request('missing',{cookie})).status,404);
 assert.equal((await request('logout',{method:'POST',value:{},cookie,origin:'https://untrusted.example'})).status,403);
 assert.equal((await request('logout',{method:'POST',value:{},cookie})).status,200);assert.equal((await request('me',{cookie})).status,401);
});
test('account revocation invalidates an existing session on its next request',async()=>{
 const r=await request('login',{method:'POST',value:credentials.find(c=>c.email.startsWith('author@'))});const cookie=r.headers.get('set-cookie').split(';')[0];
 const file=join(process.env.GOVTECH_DATA_DIR,'accounts.json'),accounts=JSON.parse(readFileSync(file));accounts.find(u=>u.role==='author').revoked=true;writeFileSync(file,JSON.stringify(accounts));assert.equal((await request('me',{cookie})).status,401);
});
test('per-account login throttling does not lock unrelated accounts',async()=>{
 const bad={email:'unknown@arkhe.local',password:'synthetic-wrong-password'};
 for(let i=0;i<10;i++)assert.equal((await request('login',{method:'POST',value:bad})).status,401);
 assert.equal((await request('login',{method:'POST',value:bad})).status,429);
 assert.equal((await request('login',{method:'POST',value:credentials.find(c=>c.email.startsWith('owner@'))})).status,200);
});
