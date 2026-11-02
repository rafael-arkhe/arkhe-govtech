import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { local } from './paths.mjs';
let instance;
export function db(){
  if(instance)return instance;
  mkdirSync(local,{recursive:true,mode:0o700});
  const filename=join(local,'govtech.sqlite');instance=new DatabaseSync(filename);
  try{
    if(process.platform!=='win32')chmodSync(filename,0o600);
    const check=instance.prepare('PRAGMA integrity_check').all();
    if(check.length!==1||check[0].integrity_check!=='ok')throw new Error('integrity');
    instance.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
      CREATE TABLE IF NOT EXISTS login_attempts(subject TEXT PRIMARY KEY,count INTEGER NOT NULL,until_ms INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS login_attempts_expiry ON login_attempts(until_ms);`);
  }catch{instance.close();instance=undefined;throw new Error('SQLite initialization failed; inspect the database or restore a verified backup.');}
  return instance;
}
const sleeper=new Int32Array(new SharedArrayBuffer(4));
const busy=error=>error?.errcode===5||(error?.errcode&255)===5||error?.code==='SQLITE_BUSY';
export function transaction(fn){
  const connection=db();
  for(let attempt=0;;attempt++){
    try{connection.exec('BEGIN IMMEDIATE');break;}
    catch(error){if(!busy(error)||attempt>=2)throw error;Atomics.wait(sleeper,0,0,20*2**attempt+Math.floor(Math.random()*20));}
  }
  try{const result=fn();if(result?.then)throw new TypeError('Transaction callbacks must be synchronous');connection.exec('COMMIT');return result;}
  catch(error){if(connection.isTransaction)connection.exec('ROLLBACK');throw error;}
}
export function readiness(){return db().prepare('SELECT 1 AS ok').get().ok===1&&db().prepare('PRAGMA foreign_keys').get().foreign_keys===1;}
