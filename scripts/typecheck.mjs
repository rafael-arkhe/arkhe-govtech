import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
for(const args of [[require.resolve('next/dist/bin/next'),'typegen'],[require.resolve('typescript/bin/tsc'),'--noEmit']]){
  const result=spawnSync(process.execPath,args,{stdio:'inherit'});
  if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
}
