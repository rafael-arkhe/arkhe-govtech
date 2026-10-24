import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { generateKeyPairSync, randomBytes, scryptSync } from 'node:crypto';
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
