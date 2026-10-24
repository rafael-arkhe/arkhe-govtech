import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
test('bootstrap honors .env.local and preserves previously generated accounts',()=>{
 const work=mkdtempSync(join(tmpdir(),'govtech-bootstrap-')),data=join(work,'private-data'),script=fileURLToPath(new URL('../scripts/setup.mjs',import.meta.url));
 mkdirSync(join(work,'config'));
 writeFileSync(join(work,'.env.local'),`GOVTECH_DATA_DIR="${data.replaceAll('\\','/')}"\n`);
 const env={...process.env};delete env.GOVTECH_DATA_DIR;
 execFileSync(process.execPath,[script],{cwd:work,env,stdio:'pipe'});
 assert.ok(existsSync(join(data,'credentials.json')));assert.equal(existsSync(join(work,'.data')),false);
 const before=readFileSync(join(data,'accounts.json'),'utf8');
 execFileSync(process.execPath,[script],{cwd:work,env,stdio:'pipe'});
 assert.equal(readFileSync(join(data,'accounts.json'),'utf8'),before);
});
