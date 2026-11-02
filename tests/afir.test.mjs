import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { AFIR_WASM_SHA256,loadAfirVerifier,parseAfirTrust,verifyAfirBundle,isAfirBundle } from '../public/govtech/afir.mjs';

const dir=new URL('../public/govtech/afir/',import.meta.url);
const gluePath=new URL('arkhe_verify_wasm.js',dir);
const glueSource=readFileSync(gluePath,'utf8');
const wasmBytes=new Uint8Array(readFileSync(new URL('arkhe_verify_wasm_bg.wasm',dir)));
const vectors=JSON.parse(readFileSync(new URL('./fixtures/afir-bundle-v1.subset.json',import.meta.url)));
const trust=parseAfirTrust(JSON.stringify(vectors.trust));
const load=(over={})=>loadAfirVerifier({glueSource,wasmBytes,importGlue:()=>import(gluePath.href),...over});
const verifier=await load();

test('pinned hashes match the vendored files and PROVENANCE.json',()=>{
  const provenance=JSON.parse(readFileSync(new URL('PROVENANCE.json',dir)));
  assert.deepEqual(provenance.sha256,AFIR_WASM_SHA256);
  assert.equal(createHash('sha256').update(glueSource).digest('hex'),AFIR_WASM_SHA256['arkhe_verify_wasm.js']);
  assert.equal(createHash('sha256').update(wasmBytes).digest('hex'),AFIR_WASM_SHA256['arkhe_verify_wasm_bg.wasm']);
});

test('a modified verifier artifact is refused before instantiation',async()=>{
  const tampered=wasmBytes.slice();tampered[100]^=1;
  await assert.rejects(load({wasmBytes:tampered}),/hash fixado: arkhe_verify_wasm_bg\.wasm/);
  await assert.rejects(load({glueSource:glueSource+'\n'}),/hash fixado: arkhe_verify_wasm\.js/);
});

test('the vendored verifier agrees with the monorepo bundle vectors',async()=>{
  for(const c of vectors.cases){
    assert.equal(isAfirBundle(c.bundle),true);
    if(c.expected==='VALID'){
      const result=await verifyAfirBundle(c.bundle,trust,verifier);
      assert.equal(result.receipts,c.bundle.receipts.length,c.id);
      assert.equal(result.mmrSize,c.bundle.receipts.length,c.id);
      assert.equal(result.attestation,'NOT_VERIFIED');
      assert.match(result.scope,/Não valida atestação/);
    }else{
      await assert.rejects(verifyAfirBundle(c.bundle,trust,verifier),new RegExp(c.expected.replace(':','\\:')),c.id);
    }
  }
});

test('trust is strict and comes from outside the bundle',async()=>{
  assert.throws(()=>parseAfirTrust('{'),/JSON inválido/);
  assert.throws(()=>parseAfirTrust(JSON.stringify({...vectors.trust,extra:1})),/informe/);
  assert.throws(()=>parseAfirTrust(JSON.stringify({...vectors.trust,receipt_key:vectors.trust.device.mldsa})),/distinta/);
  const upper={...vectors.trust,receipt_key:vectors.trust.receipt_key.toUpperCase()};
  assert.throws(()=>parseAfirTrust(JSON.stringify(upper)),/minúsculo/);
  const other={...vectors.trust,device:{...vectors.trust.device,device_id:'00'.repeat(32)}};
  await assert.rejects(verifyAfirBundle(vectors.cases[0].bundle,parseAfirTrust(JSON.stringify(other)),verifier),/CHECKPOINT:DEVICE/);
  await assert.rejects(verifyAfirBundle({format:'arkhe-govtech/local-evidence/v1'},trust,verifier),/Formato não suportado/);
});
