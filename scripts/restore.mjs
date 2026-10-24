import { DatabaseSync } from 'node:sqlite';
import { readFileSync,copyFileSync,existsSync,mkdirSync,lstatSync,chmodSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { createHash } from 'node:crypto';
const source=process.argv[2]&&resolve(process.argv[2]),destination=process.argv[3]&&resolve(process.argv[3]);
if(!source||!destination||existsSync(destination))throw new Error('Use restore <backup> <novo-diretório-ainda-inexistente>.');
const manifest=JSON.parse(readFileSync(join(source,'manifest.json'),'utf8'));
if(manifest.format!=='arkhe-govtech/backup/v1'||!Array.isArray(manifest.files)||!manifest.files.some(f=>f.name==='govtech.sqlite')||!manifest.files.some(f=>f.name==='accounts.json'))throw new Error('Manifesto de backup inválido.');
if(new Set(manifest.files.map(f=>f.name)).size!==manifest.files.length)throw new Error('Arquivos duplicados no manifesto.');
for(const f of manifest.files){
  if(!['govtech.sqlite','accounts.json','credentials.json','trust.json'].includes(f.name)&&!/^[a-z0-9_-]+\.private\.pem$/.test(f.name))throw new Error('Nome de arquivo não permitido.');
  const path=join(source,f.name),stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('Arquivo de backup inválido.');
  if(createHash('sha256').update(readFileSync(path)).digest('hex')!==f.sha256)throw new Error('Digest de backup divergente.');
}
mkdirSync(destination,{recursive:true,mode:0o700});
for(const f of manifest.files){const path=join(destination,f.name);copyFileSync(join(source,f.name),path);if(process.platform!=='win32')chmodSync(path,0o600);}
const db=new DatabaseSync(join(destination,'govtech.sqlite'));
try{
  const checks=db.prepare('PRAGMA integrity_check').all();if(checks.length!==1||checks[0].integrity_check!=='ok')throw new Error('Integridade SQLite inválida.');
  if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='gov_events'").get()){
    let previous='0'.repeat(64);for(const e of db.prepare('SELECT previous,payload,hash FROM gov_events ORDER BY seq').all()){
      if(e.previous!==previous||createHash('sha256').update(e.previous+'\n'+e.payload).digest('hex')!==e.hash)throw new Error('Cadeia local inválida.');previous=e.hash;
    }
  }
  db.exec('DELETE FROM sessions; DELETE FROM login_attempts;');
}finally{db.close();}
console.log('Restauração concluída em novo diretório; sessões antigas removidas. Configure GOVTECH_DATA_DIR antes de iniciar.');
