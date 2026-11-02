import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes,scryptSync,timingSafeEqual,createHash } from 'node:crypto';
import { local } from './paths.mjs';
import { db } from './store.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function accounts(){
  const values=JSON.parse(readFileSync(join(local,'accounts.json'),'utf8'));
  if(!Array.isArray(values)||!values.every(v=>typeof v.id==='string'&&typeof v.email==='string'&&typeof v.name==='string'&&['owner','reviewer','author'].includes(v.role)&&typeof v.publicKey==='string'&&/^[a-f0-9]{128}$/.test(v.passwordHash)&&/^[a-f0-9]{32}$/.test(v.salt)))throw new Error('Invalid local account configuration');
  if(new Set(values.map(v=>v.id)).size!==values.length||new Set(values.map(v=>v.email.toLowerCase())).size!==values.length)throw new Error('Ambiguous local account identity');
  return values;
}
export const publicUser=user=>({id:user.id,name:user.name,email:user.email,role:user.role,publicKey:user.publicKey});
export function login(email,password){
  const normalized=email.trim().toLowerCase(),subject=hash('login:'+normalized);
  db().prepare('DELETE FROM login_attempts WHERE until_ms<=?').run(Date.now());
  const attempts=db().prepare('SELECT * FROM login_attempts WHERE subject=?').get(subject);
  if(attempts?.until_ms>Date.now()&&attempts.count>=10)throw Object.assign(new Error('Muitas tentativas. Aguarde 15 minutos.'),{status:429});
  const user=accounts().find(v=>v.email.toLowerCase()===normalized);
  const actual=scryptSync(password,user?.salt||'invalid-account',64),expected=user?Buffer.from(user.passwordHash,'hex'):Buffer.alloc(64);
  if(!user||user.revoked||!timingSafeEqual(actual,expected)){
    const count=attempts?.until_ms>Date.now()?attempts.count+1:1;
    db().prepare('INSERT OR REPLACE INTO login_attempts VALUES(?,?,?)').run(subject,count,Date.now()+900000);
    throw Object.assign(new Error('E-mail ou senha inválidos.'),{status:401});
  }
  db().prepare('DELETE FROM login_attempts WHERE subject=?').run(subject);
  db().prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());
  const token=randomBytes(32).toString('hex');
  db().prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),user.id,Date.now()+28800000);
  return {token,user:publicUser(user)};
}
export function session(token){
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const row=db().prepare('SELECT user_id FROM sessions WHERE hash=? AND expires>?').get(hash(token),Date.now());
  const user=row&&accounts().find(v=>v.id===row.user_id);
  return user&&!user.revoked?publicUser(user):null;
}
export function logout(token){if(token)db().prepare('DELETE FROM sessions WHERE hash=?').run(hash(token));}
