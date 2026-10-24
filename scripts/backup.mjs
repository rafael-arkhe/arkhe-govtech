import { DatabaseSync,backup } from 'node:sqlite';
import { existsSync,mkdirSync,copyFileSync,chmodSync,readFileSync,writeFileSync,readdirSync,lstatSync } from 'node:fs';
import { resolve,join,relative,isAbsolute,sep } from 'node:path';
import { createHash } from 'node:crypto';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const {local}=await import('../lib/paths.mjs');
const destination=process.argv[2]&&resolve(process.argv[2]);
if(!destination||existsSync(destination))throw new Error('Informe um novo diretório de backup, ainda inexistente.');
const rel=relative(local,destination);if(rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep)))throw new Error('O backup deve ficar fora do diretório ativo de dados.');
if(!existsSync(join(local,'govtech.sqlite')))throw new Error('Banco inexistente. Inicie a instalação antes do backup.');
mkdirSync(destination,{recursive:true,mode:0o700});
const source=new DatabaseSync(join(local,'govtech.sqlite'),{readOnly:true});
try{await backup(source,join(destination,'govtech.sqlite'));}finally{source.close();}
const names=['govtech.sqlite'];
for(const name of readdirSync(local))if(['accounts.json','credentials.json','trust.json'].includes(name)||/^[a-z0-9_-]+\.private\.pem$/.test(name)){
  if(!lstatSync(join(local,name)).isFile())throw new Error('Arquivo de conta inválido no diretório de dados.');
  copyFileSync(join(local,name),join(destination,name));names.push(name);
}
const files=names.map(name=>{if(process.platform!=='win32')chmodSync(join(destination,name),0o600);return {name,sha256:createHash('sha256').update(readFileSync(join(destination,name))).digest('hex')};});
writeFileSync(join(destination,'manifest.json'),JSON.stringify({format:'arkhe-govtech/backup/v1',at:new Date().toISOString(),containsPrivateKeys:true,files},null,2),{mode:0o600});
console.log('Backup consistente concluído. Contém credenciais e chaves privadas: proteja e não publique o diretório.');
