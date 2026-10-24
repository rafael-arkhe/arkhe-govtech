import { spawnSync } from 'node:child_process';
const result=spawnSync(process.execPath,['scripts/setup.mjs'],{env:process.env,stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
await import('../server.js');
