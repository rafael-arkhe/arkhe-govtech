import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const env={...process.env};
if(process.platform==='win32')env.NODE_OPTIONS=`${env.NODE_OPTIONS||''} --require="${fileURLToPath(new URL('./windows-links.cjs',import.meta.url)).replaceAll('\\','/')}"`;
const result=spawnSync(process.execPath,[createRequire(import.meta.url).resolve('next/dist/bin/next'),'build'],{env,stdio:'inherit'});
if(result.error)throw result.error;process.exit(result.status??1);
