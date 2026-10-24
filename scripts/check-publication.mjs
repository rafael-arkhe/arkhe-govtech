import { execFileSync } from 'node:child_process';
import { readFileSync,existsSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const errors=[];
if(!files.length)errors.push('Nenhum arquivo versionado. Execute git add antes da auditoria.');
for(const name of files){
  if(/(^|\/)(?:node_modules|\.next|\.data|backups)(?:\/|$)|\.(?:sqlite(?:-wal|-shm)?|pem)$|(^|\/)(?:credentials|accounts|trust)\.json$|(^|\/)\.env(?!\.example$)/i.test(name))errors.push('Arquivo privado ou gerado: '+name);
  const bytes=readFileSync(name);if(bytes.includes(0))continue;
  const text=bytes.toString('utf8');
  if(/-{5}BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-{5}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}/.test(text))errors.push('Possível credencial em '+name);
  if(name.endsWith('.md'))for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
    const link=match[1].replace(/^<|>$/g,'').split('#')[0];if(!link||/^(?:https?:|mailto:)/.test(link))continue;
    if(!existsSync(resolve(dirname(name),link)))errors.push(`Link local inválido em ${name}: ${link}`);
  }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`PASS: ${files.length} arquivos; sem credenciais detectadas ou links locais quebrados. A verificação é heurística.`);
