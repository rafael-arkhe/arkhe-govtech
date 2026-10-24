import { spawn,spawnSync } from 'node:child_process';
import { existsSync,cpSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root=fileURLToPath(new URL('..',import.meta.url));process.chdir(root);
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
if(Number(process.versions.node.split('.')[0])!==24)throw new Error('Use Node.js 24.x.');
const mode=process.argv[2]==='start'?'start':'dev',port=Number(process.env.PORT||3012),host=process.env.HOST||'127.0.0.1';
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT inválida.');
const configured=process.env.GOVTECH_ORIGIN||`http://127.0.0.1:${port}`;
const url=new URL(configured);if(!['http:','https:'].includes(url.protocol)||url.origin!==configured)throw new Error('GOVTECH_ORIGIN deve ser uma origem HTTP(S) sem caminho ou barra final.');
const env={...process.env,PORT:String(port),HOSTNAME:host,GOVTECH_ORIGIN:configured,GOVTECH_DATA_DIR:resolve(process.env.GOVTECH_DATA_DIR||'.data')};
const setup=spawnSync(process.execPath,['scripts/setup.mjs'],{cwd:root,env,stdio:'inherit'});if(setup.status!==0)process.exit(setup.status||1);
let entry,args;
if(mode==='start'){
  entry=resolve('.next/standalone/server.js');if(!existsSync(entry))throw new Error('Execute pnpm build antes de pnpm start.');
  cpSync('public','.next/standalone/public',{recursive:true});mkdirSync('.next/standalone/.next',{recursive:true});cpSync('.next/static','.next/standalone/.next/static',{recursive:true});args=[entry];
}else{entry=createRequire(import.meta.url).resolve('next/dist/bin/next');args=[entry,'dev','--hostname',host,'--port',String(port)];}
console.log(`Arkhe GovTech: ${configured}\nDados privados: ${env.GOVTECH_DATA_DIR}`);
const child=spawn(process.execPath,args,{cwd:root,env,stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code||0));child.on('error',error=>{console.error(error.message);process.exit(1);});
