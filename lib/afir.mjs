// AFiR evidence for simulated executions: one ML-DSA-65 receipt per execution, appended
// to an rbb-mmr v3 history and sealed by a hybrid ML-DSA-65 + Ed25519 checkpoint.
// Byte layouts follow arkhe-verify-core (afir, afir_checkpoint); the vendored WASM
// supplies BLAKE3 and re-verifies every receipt and every exported bundle.
// The "model" is the synthetic simulator, not an AI model: model_fp names its descriptor.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPrivateKey, sign } from 'node:crypto';
import { local } from './paths.mjs';
import { loadAfirVerifier, AFIR_BUNDLE_PROFILE } from '../public/govtech/afir.mjs';

const RECEIPT_CONTEXT = Buffer.from('ARKHE_AFIR_RECEIPT_V1');
const CHECKPOINT_CONTEXT = Buffer.from('ARKHE_AFIR_CHECKPOINT_V1');
const CID_RAW_BLAKE3 = Buffer.from([0x01, 0x55, 0x1e, 0x20]);
export const EXECUTOR_DESCRIPTOR = JSON.stringify({ domain: 'arkhe-govtech/executor/v1', name: 'synthetic-simulator', version: '0.1.0', externalEffect: false });

let verifier, keys;
/** Loads the pinned WASM once; call before any synchronous AFiR operation. */
export async function afirReady() {
  if (verifier) return;
  const dir = resolve(process.cwd(), 'public/govtech/afir');
  const glue = join(dir, 'arkhe_verify_wasm.js');
  verifier = await loadAfirVerifier({
    glueSource: readFileSync(glue, 'utf8'),
    wasmBytes: new Uint8Array(readFileSync(join(dir, 'arkhe_verify_wasm_bg.wasm'))),
    importGlue: () => import(/* webpackIgnore: true */ pathToFileURL(glue).href)
  });
}
const loaded = () => { if (!verifier) throw new Error('Verificador AFiR não carregado.'); return verifier; };

const blake3 = (...parts) => Buffer.from(loaded().blake3_hex(Buffer.concat(parts.map(p => Buffer.from(p)))), 'hex');
const u64 = n => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(n)); return b; };
const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
const chunkCid = bytes => Buffer.concat([CID_RAW_BLAKE3, blake3(bytes)]);

// rbb-mmr v3 (arkhe-verify-core::rbb::mmr): domain-separated BLAKE3, right-fold bagging.
const leaf = (index, record) => blake3('AKG:MMR:LEAF:v3\0', u64(index), record);
const node = (l, r) => blake3('AKG:MMR:NODE:v3\0', l, r);
export function mmrRoot(records) {
  const peaks = [];
  records.forEach((record, index) => {
    let current = leaf(index, record);
    for (let n = index; n & 1; n >>= 1) current = node(peaks.pop(), current);
    peaks.push(current);
  });
  let bag = peaks.at(-1);
  for (const peak of peaks.slice(0, -1).reverse()) bag = blake3('AKG:MMR:BAG:v3\0', peak, bag);
  return blake3('AKG:MMR:ROOT:v3\0', u64(records.length), bag);
}
export const recordHash = signed => blake3('AKG:AFIR:RECORD:v1\0', signed);

function material() {
  if (keys) return keys;
  const trust = JSON.parse(readFileSync(join(local, 'afir-trust.json'), 'utf8'));
  const pem = name => createPrivateKey(readFileSync(join(local, name)));
  keys = { trust, receipt: pem('afir-receipt.private.pem'), sealEd25519: pem('afir-seal-ed25519.private.pem'), sealMlDsa: pem('afir-seal-mldsa.private.pem') };
  return keys;
}
export const afirTrust = () => material().trust;

/** Listing A.1 payload for one executed case; every commitment is domain-separated. */
function receiptPayload(c, policyDigest) {
  const policyId = blake3('AKG:AFIR:POLICY-ID:v1\0', Buffer.from(policyDigest, 'hex')).subarray(0, 16);
  const executorCid = chunkCid(EXECUTOR_DESCRIPTOR);
  const nonce = blake3('arkhe-govtech/afir-nonce/v1\n', c.receipt.operationId).subarray(0, 16);
  return Buffer.concat([
    Buffer.from([0x01, 0x01]), policyId, blake3(executorCid), executorCid,
    blake3('arkhe-govtech/afir-input/v1\n', c.digest),
    blake3('arkhe-govtech/afir-output/v1\n', JSON.stringify(c.receipt)),
    nonce, u64(Math.floor(Date.parse(c.receipt.at) / 1000))
  ]);
}

/**
 * Signs the receipt, extends the history and seals a checkpoint, inside the caller's
 * SQLite transaction. `history` holds the previously sealed rows in order.
 */
export function sealExecution(c, policyDigest, history) {
  const k = material(), v = loaded();
  const payload = receiptPayload(c, policyDigest);
  const receipt = Buffer.concat([payload, sign(null, payload, { key: k.receipt, context: RECEIPT_CONTEXT })]);
  JSON.parse(v.verify_afir_receipt(receipt, Buffer.from(k.trust.receipt_key, 'hex'), '{}'));
  const records = [...history.map(row => recordHash(Buffer.from(row.receipt, 'hex'))), recordHash(receipt)];
  const body = Buffer.concat([
    Buffer.from([0x01]), Buffer.from(k.trust.device.device_id, 'hex'), mmrRoot(records), u64(records.length),
    history.length ? Buffer.from(history.at(-1).checkpoint_id, 'hex') : Buffer.alloc(32), u32(0),
    blake3('arkhe-govtech/policy-summary/v1\n', policyDigest)
  ]);
  const id = blake3('AKG:AFIR:CHECKPOINT:v1\0', body);
  const checkpoint = Buffer.concat([body, sign(null, id, { key: k.sealMlDsa, context: CHECKPOINT_CONTEXT }), sign(null, id, k.sealEd25519)]);
  return { receipt: receipt.toString('hex'), checkpoint: checkpoint.toString('hex'), checkpointId: id.toString('hex'), mmrSize: records.length };
}

/** Full bundle, verified by the pinned WASM before it leaves the server. */
export function afirBundle(rows) {
  const bundle = { profile: AFIR_BUNDLE_PROFILE, checkpoints: rows.map(r => r.checkpoint), receipts: rows.map(r => r.receipt) };
  const report = JSON.parse(loaded().verify_afir_bundle(JSON.stringify(bundle), JSON.stringify(material().trust)));
  return { bundle, report };
}
