// AFiR OfflineVerificationBundle v1 through the vendored arkhe-verify-wasm build.
// No network beyond the two pinned same-origin files; both are hashed before use.
export const AFIR_BUNDLE_PROFILE='arkhe-afir-bundle-v1';
// Must equal public/govtech/afir/PROVENANCE.json; a test pins both.
export const AFIR_WASM_SHA256={
  'arkhe_verify_wasm.js':'b6ea4308e84de3a8962184beb9c05d2b5ab00156638ae47cc90d993b8bd1fc08',
  'arkhe_verify_wasm_bg.wasm':'b21f4e1b0a89665de759d17b4383b7e1ecd9774d730722ac7fec94c150da0a67'
};
const SCOPE='Assinaturas ML-DSA-65 dos recibos e da cadeia de checkpoints híbrida, sob as chaves fixadas informadas. Não valida atestação do dispositivo, correção do conteúdo, horário, poderes jurídicos ou ato estatal.';
const hex=bytes=>Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('');

async function pinned(name,bytes,cryptoApi){
  const digest=hex(await cryptoApi.subtle.digest('SHA-256',bytes));
  if(digest!==AFIR_WASM_SHA256[name])throw new Error('Verificador AFiR divergente do hash fixado: '+name+'.');
}

/** Checks both artifacts against the pinned hashes, then instantiates the verifier. */
export async function loadAfirVerifier({glueSource,wasmBytes,importGlue,cryptoApi=globalThis.crypto}){
  await pinned('arkhe_verify_wasm.js',new TextEncoder().encode(glueSource),cryptoApi);
  await pinned('arkhe_verify_wasm_bg.wasm',wasmBytes,cryptoApi);
  const glue=await importGlue(glueSource);
  glue.initSync({module:wasmBytes});
  return glue;
}

/**
 * Browser loader. The app CSP (script-src 'self') forbids blob: modules, so the glue is
 * imported from the same URL whose text was just hashed; the WASM bytes that do the
 * verification are the exact hashed bytes. The pin rejects a stale or mismatched build;
 * it cannot defend against a malicious server, which could also replace this file.
 */
export async function loadAfirVerifierFromOrigin(base='/govtech/afir/'){
  const get=async name=>{const r=await fetch(base+name,{cache:'no-store'});if(!r.ok)throw new Error('Verificador AFiR indisponível: '+name+'.');return r;};
  const glueSource=await (await get('arkhe_verify_wasm.js')).text();
  const wasmBytes=new Uint8Array(await (await get('arkhe_verify_wasm_bg.wasm')).arrayBuffer());
  return loadAfirVerifier({glueSource,wasmBytes,importGlue:()=>import(/* webpackIgnore: true */ base+'arkhe_verify_wasm.js')});
}

export function isAfirBundle(bundle){return bundle?.profile===AFIR_BUNDLE_PROFILE;}

/** Pinned trust must come from an independent channel, never from the bundle itself. */
export function parseAfirTrust(text){
  let t;try{t=JSON.parse(text);}catch{throw new Error('Confiança AFiR: JSON inválido.');}
  const ok=(v,n)=>typeof v==='string'&&new RegExp(`^[0-9a-f]{${n}}$`).test(v);
  const d=t?.device;
  if(!t||Object.keys(t).sort().join()!=='device,receipt_key'||!d||Object.keys(d).sort().join()!=='device_id,ed25519,mldsa'||!ok(d.device_id,64)||!ok(d.ed25519,64)||!ok(d.mldsa,3904)||!ok(t.receipt_key,3904))
    throw new Error('Confiança AFiR: informe {device:{device_id,ed25519,mldsa},receipt_key} em hexadecimal minúsculo.');
  if(d.mldsa===t.receipt_key)throw new Error('Confiança AFiR: a chave de recibo deve ser distinta da chave de selagem.');
  return {device:{device_id:d.device_id,ed25519:d.ed25519,mldsa:d.mldsa},receipt_key:t.receipt_key};
}

export async function verifyAfirBundle(bundle,trust,verifier){
  if(!isAfirBundle(bundle))throw new Error('Formato não suportado.');
  let report;
  try{report=JSON.parse(verifier.verify_afir_bundle(JSON.stringify(bundle),JSON.stringify(trust)));}
  catch(e){throw new Error('Pacote AFiR rejeitado: '+(typeof e==='string'?e:'erro do verificador')+'.');}
  return {valid:true,receipts:report.receipts.length,checkpoints:report.checkpoints,mmrSize:report.mmr_size,mmrRoot:report.mmr_root,checkpointId:report.checkpoint_id,attestation:report.attestation,scope:SCOPE};
}
