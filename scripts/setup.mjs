import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { generateKeyPairSync, randomBytes, scryptSync } from 'node:crypto';
import { readdirSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const { local } = await import('../lib/paths.mjs');
mkdirSync(local, { recursive: true, mode: 0o700 });
if (existsSync(join(local, 'accounts.json'))) {
  console.log('Contas existentes preservadas no diretório privado de dados.');
} else {
  const credentials = [];
  const accounts = [['author', 'Ana Costa', 'author'], ['reviewer', 'Carlos Santos', 'reviewer'], ['owner', 'Mariana Silva', 'owner']].map(([id, name, role]) => {
    const password = randomBytes(18).toString('base64url');
    const salt = randomBytes(16).toString('hex');
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const email = `${id}@arkhe.local`;
    writeFileSync(join(local, `${id}.private.pem`), privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
    credentials.push({ email, password, privateKeyFile: `${id}.private.pem` });
    return { id, name, role, email, salt, passwordHash: scryptSync(password, salt, 64).toString('hex'), publicKey: publicKey.export({ type: 'spki', format: 'pem' }) };
  });
  writeFileSync(join(local, 'accounts.json'), JSON.stringify(accounts, null, 2), { mode: 0o600, flag: 'wx' });
  writeFileSync(join(local, 'trust.json'), JSON.stringify({ format: 'arkhe-govtech/bootstrap-trust/v1', accounts: accounts.map(({ id, role, publicKey }) => ({ id, role, publicKey })) }, null, 2), { mode: 0o600, flag: 'wx' });
  writeFileSync(join(local, 'credentials.json'), JSON.stringify(credentials, null, 2), { mode: 0o600, flag: 'wx' });
  if (process.platform !== 'win32') chmodSync(local, 0o700);
  console.log('Três contas locais criadas. Consulte diretório privado de dados/credentials.json; nenhuma senha foi exibida.');
}
// AFiR keys: receipt key distinct from the device sealing pair (I-PC6). All or none.
const afirFiles = ['afir-receipt.private.pem', 'afir-seal-ed25519.private.pem', 'afir-seal-mldsa.private.pem', 'afir-trust.json'];
const present = afirFiles.filter(name => readdirSync(local).includes(name));
if (present.length === afirFiles.length) {
  console.log('Chaves AFiR existentes preservadas no diretório privado de dados.');
} else if (present.length) {
  throw new Error('Chaves AFiR incompletas no diretório privado de dados; restaure um backup verificado.');
} else {
  const pair = type => generateKeyPairSync(type);
  const [receipt, ed, ml] = [pair('ml-dsa-65'), pair('ed25519'), pair('ml-dsa-65')];
  const raw = (key, field) => Buffer.from(key.export({ format: 'jwk' })[field], 'base64url').toString('hex');
  const write = (name, key) => writeFileSync(join(local, name), key.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
  write('afir-receipt.private.pem', receipt.privateKey);
  write('afir-seal-ed25519.private.pem', ed.privateKey);
  write('afir-seal-mldsa.private.pem', ml.privateKey);
  const trust = { device: { device_id: randomBytes(32).toString('hex'), ed25519: raw(ed.publicKey, 'x'), mldsa: raw(ml.publicKey, 'pub') }, receipt_key: raw(receipt.publicKey, 'pub') };
  writeFileSync(join(local, 'afir-trust.json'), JSON.stringify(trust, null, 2), { mode: 0o600, flag: 'wx' });
  console.log('Chaves AFiR locais criadas; a confiança pública está em afir-trust.json.');
}
