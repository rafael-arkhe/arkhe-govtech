import { createPublicKey, verify } from 'node:crypto';
/** Native Ed25519 only. No WASM, Rust, ICP-Brasil or network dependency. */
export function verifySignature(bytes,signature,publicKey){
  try{
    if(typeof bytes!=='string'||typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature))return false;
    const key=createPublicKey(publicKey);
    return key.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(bytes),key,Buffer.from(signature,'base64'));
  }catch{return false;}
}
