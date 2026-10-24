import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sign,createHash } from 'node:crypto';
process.env.GOVTECH_ORIGIN='http://127.0.0.1:3003';
process.env.GOVTECH_DATA_DIR=mkdtempSync(join(tmpdir(),'arkhe-govtech-test-'));
const cwd=fileURLToPath(new URL('..',import.meta.url));
execFileSync(process.execPath,['scripts/setup.mjs'],{cwd,env:process.env,stdio:'pipe'});
const {handle}=await import('../lib/http.mjs');
const {db}=await import('../lib/store.mjs');
const {verifyGovBundle}=await import('../public/govtech/verify.mjs');
const credentials=JSON.parse(readFileSync(join(process.env.GOVTECH_DATA_DIR,'credentials.json')));
const cookies={},origin='http://127.0.0.1:3003';
async function request(path,role,data,source=origin){const response=await handle(new Request(origin+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{Origin:source,'Content-Type':'application/json',Cookie:cookies[role]||''},...(data===undefined?{}:{body:JSON.stringify(data)})}),path.split('/'));return {status:response.status,value:await response.json(),response};}
const proposal={title:'Equipamentos para laboratório público',reference:'SYNTH-2026/001',agency:'inovacao',kind:'despesa',body:'Conferência sintética dos itens entregues no laboratório.',sourceDigest:createHash('sha256').update('synthetic source').digest('hex'),items:[{label:'Equipamento A',amount:20000},{label:'Equipamento B',amount:30000}]};
async function action(c,role,action,extra={}){return request(`govtech/cases/${c.id}/action`,role,{revision:c.revision,action,...extra});}
async function approve(c){const ch=await request(`govtech/cases/${c.id}/challenge`,'reviewer');assert.equal(ch.status,200,ch.value.error);const signature=sign(null,Buffer.from(ch.value.statement),readFileSync(join(process.env.GOVTECH_DATA_DIR,'reviewer.private.pem'))).toString('base64');return action(c,'reviewer','approve',{statement:ch.value.statement,signature});}
test('GovTech: authenticated, signed, durable local workflow',async t=>{
 for(const role of ['owner','author','reviewer']){const login=await request('login',role,credentials.find(c=>c.email.startsWith(role+'@')));assert.equal(login.status,200);cookies[role]=login.response.headers.get('set-cookie').split(';')[0];}
 let c;
 await t.test('pilot plan is versioned, role-restricted and requires evidence for documented controls',async()=>{
  const plan=(await request('govtech','owner')).value.pilot;
  assert.equal((await request('govtech/pilot','author',plan)).status,403);
  const unsupported=structuredClone(plan);unsupported.controls[0].state='documented';
  assert.equal((await request('govtech/pilot','owner',unsupported)).status,400);
  const valid={...plan,owner:'Equipe sintética',notes:'Plano de avaliação local; sem piloto institucional.',controls:plan.controls.map(c=>({...c,state:'progress',evidence:'Critério em preparação para validação.'}))};
  const r=await request('govtech/pilot','owner',valid);assert.equal(r.status,200,r.value.error);assert.equal(r.value.revision,2);
  assert.equal((await request('govtech/pilot','owner',valid)).status,409);
  assert.equal((await request('govtech','reviewer')).value.pilot.owner,'Equipe sintética');
  assert.equal((await request('govtech','author')).value.pilot,null);
 });
 await t.test('session, CSRF and role checks',async()=>{
  assert.equal((await request('govtech')).status,401);
  assert.equal((await request('govtech/cases','author',proposal,'https://evil.example')).status,403);
  assert.equal((await request('govtech/cases','reviewer',proposal)).status,403);
  assert.equal((await request('govtech/settings','author',{action:'stop',revision:1,stopped:true})).status,403);
 });
 await t.test('validates monetary domain and source commitments',async()=>{
  for(const invalid of [{items:[{label:'invalid',amount:-1}]},{items:[{label:'invalid',amount:1.5}]},{sourceDigest:'none'},{agency:'foreign'},{items:[]}]) assert.equal((await request('govtech/cases','author',{...proposal,...invalid})).status,400);
  const created=await request('govtech/cases','author',proposal);assert.equal(created.status,201,created.value.error);c=created.value;
  assert.equal(c.status,'draft');assert.equal((await action(c,'owner','execute')).status,409);
 });
 await t.test('signed independent review; no self approval or unsigned approval',async()=>{
  let r=await action(c,'author','submit');assert.equal(r.status,200,r.value.error);c=r.value;
  assert.equal((await action(c,'author','approve',{})).status,403);
  assert.equal((await action(c,'reviewer','approve',{statement:'{}',signature:'bad'})).status,409);
  const ch=await request(`govtech/cases/${c.id}/challenge`,'reviewer');
  assert.equal((await action(c,'reviewer','approve',{statement:ch.value.statement,signature:'bad'})).status,403);
  r=await approve(c);assert.equal(r.status,200,r.value.error);c=r.value;assert.equal(c.status,'authorized');
 });
 await t.test('changed policy invalidates dispatch, re-review restores it',async()=>{
  let cfg=(await request('govtech','owner')).value.config;
  let r=await request('govtech/settings','owner',{action:'policy',revision:cfg.revision,agency:'inovacao',limit:9000000,humanAbove:500000});assert.equal(r.status,200);
  assert.equal((await action(c,'owner','execute')).status,409);
  r=await action(c,'author','resubmit');assert.equal(r.status,200);c=r.value;
  r=await approve(c);assert.equal(r.status,200);c=r.value;
 });
 await t.test('emergency stop blocks effect and conservatively requires re-review after resume',async()=>{
  let cfg=(await request('govtech','owner')).value.config;
  let r=await request('govtech/settings','owner',{action:'stop',revision:cfg.revision,stopped:true});assert.equal(r.status,200);
  assert.equal((await action(c,'owner','execute')).status,409);
  r=await request('govtech/settings','owner',{action:'stop',revision:r.value.revision,stopped:false});assert.equal(r.status,200);
  assert.equal((await action(c,'owner','execute')).status,409);
  c=(await action(c,'author','resubmit')).value;c=(await approve(c)).value;
 });
 await t.test('atomic synthetic effect, journal and replay survive separate database connection',async()=>{
  assert.equal((await action(c,'reviewer','execute')).status,403);
  const r=await action(c,'owner','execute');assert.equal(r.status,200,r.value.error);c=r.value;
  assert.equal(c.status,'executed');assert.equal(c.receipt.externalEffect,false);
  assert.equal((await action(c,'owner','execute')).value.receipt.operationId,c.receipt.operationId);
  assert.equal(db().prepare('SELECT COUNT(*) AS n FROM gov_journal').get().n,1);
  const out=execFileSync(process.execPath,['--input-type=module','-e',"import {DatabaseSync} from 'node:sqlite';const db=new DatabaseSync(process.env.GOVTECH_DATA_DIR+'/govtech.sqlite');console.log(db.prepare('SELECT COUNT(*) AS n FROM gov_journal').get().n);"],{cwd,env:process.env,encoding:'utf8',stdio:['ignore','pipe','pipe']});assert.equal(out.trim(),'1');
 });
 await t.test('offline verifier detects content, arithmetic, signature, snapshot and chain tampering',async()=>{
  const exported=await request(`govtech/cases/${c.id}/export`,'owner');assert.equal(exported.status,200);const b=exported.value;
  assert.equal((await verifyGovBundle(b,b.checkpoint)).valid,true);
  const html=readFileSync(join(cwd,'public/govtech/offline.html'),'utf8');
  const script=/<script>([\s\S]*?)<\/script>/.exec(html)[1];
  const standalone=new Function('document',script+';return verifyGovBundle;')({querySelector:()=>({})});
  assert.equal((await standalone(b,b.checkpoint)).valid,true);
  assert.ok(html.includes("connect-src 'none'"));
  for(const mutate of [b=>b.case.title='forged',b=>b.case.proof.limit=999999999,b=>b.case.proof.prefixTotals[1]++,b=>b.case.review.signature='bad',b=>b.events.pop(),b=>b.case.receipt.externalEffect=true]){const changed=structuredClone(b);mutate(changed);await assert.rejects(verifyGovBundle(changed,b.checkpoint));}
  await assert.rejects(verifyGovBundle(b,'0'.repeat(64)));
  assert.equal((await request(`govtech/cases/${c.id}/export`,'author')).status,403);
  assert.throws(()=>db().exec("DELETE FROM gov_events"),/append only/);
 });
 await t.test('stale revisions, over-limit submission and independent rejection',async()=>{
  assert.equal((await action({...c,revision:1},'owner','execute')).status,409);
  let draft=(await request('govtech/cases','author',{...proposal,items:[{label:'Above policy',amount:100000000}]})).value;
  assert.equal((await action(draft,'author','submit')).status,409);
  draft=(await request('govtech/cases','owner',{...proposal,kind:'licitacao',items:[{label:'Sem despesa',amount:0}]})).value;
  draft=(await action(draft,'owner','submit')).value;
  assert.equal((await request('govtech','author')).value.cases.some(c=>c.id===draft.id),false);
  const r=await action(draft,'reviewer','reject',{reason:'Fonte precisa de validação adicional.'});assert.equal(r.status,200);assert.equal(r.value.status,'rejected');
  const b=(await request(`govtech/cases/${draft.id}/export`,'reviewer')).value;assert.equal((await verifyGovBundle(b,b.checkpoint)).valid,true);
 });
});
