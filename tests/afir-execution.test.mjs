import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sign,createHash } from 'node:crypto';
process.env.GOVTECH_ORIGIN='http://127.0.0.1:3003';
process.env.GOVTECH_DATA_DIR=mkdtempSync(join(tmpdir(),'arkhe-govtech-afir-'));
const cwd=fileURLToPath(new URL('..',import.meta.url));
execFileSync(process.execPath,['scripts/setup.mjs'],{cwd,env:process.env,stdio:'pipe'});
const {handle}=await import('../lib/http.mjs');
const {db}=await import('../lib/store.mjs');
const {loadAfirVerifier,parseAfirTrust,verifyAfirBundle}=await import('../public/govtech/afir.mjs');
const credentials=JSON.parse(readFileSync(join(process.env.GOVTECH_DATA_DIR,'credentials.json')));
const cookies={},origin='http://127.0.0.1:3003';
async function request(path,role,data){const response=await handle(new Request(origin+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookies[role]||''},...(data===undefined?{}:{body:JSON.stringify(data)})}),path.split('/'));return {status:response.status,value:await response.json()};}
const action=(c,role,name,extra={})=>request(`govtech/cases/${c.id}/action`,role,{revision:c.revision,action:name,...extra});
async function executed(title){
  let c=(await request('govtech/cases','author',{title,reference:'SYNTH-AFIR/'+title.length,agency:'inovacao',kind:'despesa',body:'Execução sintética para evidência AFiR.',sourceDigest:createHash('sha256').update(title).digest('hex'),items:[{label:'Item',amount:1000}]})).value;
  c=(await action(c,'author','submit')).value;
  const ch=await request(`govtech/cases/${c.id}/challenge`,'reviewer');
  const signature=sign(null,Buffer.from(ch.value.statement),readFileSync(join(process.env.GOVTECH_DATA_DIR,'reviewer.private.pem'))).toString('base64');
  c=(await action(c,'reviewer','approve',{statement:ch.value.statement,signature})).value;
  const r=await action(c,'owner','execute');assert.equal(r.status,200,r.value.error);return r.value;
}
const dir=new URL('../public/govtech/afir/',import.meta.url);
const verifier=await loadAfirVerifier({glueSource:readFileSync(new URL('arkhe_verify_wasm.js',dir),'utf8'),wasmBytes:new Uint8Array(readFileSync(new URL('arkhe_verify_wasm_bg.wasm',dir))),importGlue:()=>import(new URL('arkhe_verify_wasm.js',dir).href)});

test('simulated executions emit AFiR receipts and checkpoints that the Rust verifier accepts',async t=>{
  for(const role of ['owner','author','reviewer']){const r=await handle(new Request(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(credentials.find(c=>c.email.startsWith(role+'@')))}),['login']);cookies[role]=r.headers.get('set-cookie').split(';')[0];}
  await t.test('no bundle before the first sealed execution; author cannot read AFiR evidence',async()=>{
    assert.equal((await request('govtech/afir/bundle','owner')).status,409);
    assert.equal((await request('govtech/afir/trust','author')).status,403);
  });
  const first=await executed('Primeira execução AFiR');
  const second=await executed('Segunda execução AFiR');
  const replay=await action(second,'owner','execute');
  await t.test('each execution is sealed once, in order, inside its transaction',()=>{
    assert.equal(first.afir.mmrSize,1);assert.equal(second.afir.mmrSize,2);
    assert.equal(replay.value.afir.checkpointId,second.afir.checkpointId);
    assert.equal(db().prepare('SELECT COUNT(*) AS n FROM gov_afir').get().n,2);
    assert.throws(()=>db().exec('DELETE FROM gov_afir'),/append only/);
  });
  const trustResponse=await request('govtech/afir/trust','owner');
  const trust=parseAfirTrust(JSON.stringify(trustResponse.value.trust));
  const exported=await request('govtech/afir/bundle','reviewer');
  await t.test('exported bundle verifies with the pinned Rust verifier, independently of the server check',async()=>{
    assert.equal(exported.status,200,exported.value.error);
    const bundle=exported.value;
    assert.deepEqual(Object.keys(bundle).sort(),['checkpoints','profile','receipts']);
    const result=await verifyAfirBundle(bundle,trust,verifier);
    assert.equal(result.receipts,2);assert.equal(result.checkpoints,2);assert.equal(result.mmrSize,2);
    assert.equal(result.checkpointId,second.afir.checkpointId);
    const report=JSON.parse(verifier.verify_afir_bundle(JSON.stringify(bundle),JSON.stringify(trust)));
    const blake=s=>verifier.blake3_hex(Buffer.from(s));
    assert.equal(report.receipts[1].input_hash,blake('arkhe-govtech/afir-input/v1\n'+second.digest));
    assert.equal(report.receipts[1].output_hash,blake('arkhe-govtech/afir-output/v1\n'+JSON.stringify(second.receipt)));
  });
  await t.test('removal, reordering and a foreign trust are rejected',async()=>{
    const bundle=exported.value;
    const removed={...bundle,receipts:bundle.receipts.slice(1)};
    await assert.rejects(verifyAfirBundle(removed,trust,verifier),/rejeitado/);
    const swapped={...bundle,receipts:[bundle.receipts[1],bundle.receipts[0]]};
    await assert.rejects(verifyAfirBundle(swapped,trust,verifier),/CHECKPOINT:EXTENSION/);
    const foreign=parseAfirTrust(JSON.stringify({...trustResponse.value.trust,device:{...trustResponse.value.trust.device,device_id:'11'.repeat(32)}}));
    await assert.rejects(verifyAfirBundle(bundle,foreign,verifier),/CHECKPOINT:DEVICE/);
  });
  await t.test('receipt and sealing keys are distinct and setup preserves them',()=>{
    assert.notEqual(trust.receipt_key,trust.device.mldsa);
    const before=readFileSync(join(process.env.GOVTECH_DATA_DIR,'afir-trust.json'),'utf8');
    execFileSync(process.execPath,['scripts/setup.mjs'],{cwd,env:process.env,stdio:'pipe'});
    assert.equal(readFileSync(join(process.env.GOVTECH_DATA_DIR,'afir-trust.json'),'utf8'),before);
  });
});
