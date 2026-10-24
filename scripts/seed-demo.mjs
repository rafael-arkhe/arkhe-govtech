import { existsSync,readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sign,createHash } from 'node:crypto';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
if(!process.argv.includes('--confirm-synthetic'))throw new Error('Use --confirm-synthetic para criar dados fictícios nesta instalação.');
const {local}=await import('../lib/paths.mjs');
const {accounts}=await import('../lib/auth.mjs');
const {govState,govCreate,govAction,govChallenge}=await import('../lib/govtech.mjs');
const users=accounts(),owner=users.find(u=>u.role==='owner'),author=users.find(u=>u.role==='author'),reviewer=users.find(u=>u.role==='reviewer');
if(!owner||!author||!reviewer)throw new Error('Execute pnpm run setup e preserve as três contas de demonstração.');
if(govState(owner).config.stopped)throw new Error('Parada ativa: nenhum dado foi alterado. Retome explicitamente no app antes de semear demonstrações.');
const scenarios=[['despesa','DEMO-001','Demonstração · equipamentos do laboratório',480000,'executed'],['licitacao','DEMO-002','Demonstração · triagem documental',0,'review'],['atendimento','DEMO-003','Demonstração · esclarecimento ao cidadão',0,'draft'],['despesa','DEMO-004','Demonstração · proposta rejeitada',25000,'rejected']];
for(const [kind,reference,title,amount,target] of scenarios){
  if(govState(owner).cases.some(c=>c.reference===reference)){console.log(`Preservado: ${reference}`);continue;}
  let c=govCreate(author,{kind,reference,title,agency:'inovacao',body:'DADOS SINTÉTICOS. Exemplo de avaliação local. Não representa aquisição, decisão, cliente ou ato público real.',sourceDigest:createHash('sha256').update('synthetic source '+reference).digest('hex'),items:[{label:'Item sintético para demonstração',amount}]});
  if(target!=='draft')c=govAction(author,c.id,{action:'submit',revision:c.revision});
  if(target==='rejected')c=govAction(reviewer,c.id,{action:'reject',revision:c.revision,reason:'Exemplo sintético: fonte ainda precisa de validação.'});
  if(target==='executed'){
    const ch=govChallenge(reviewer,c.id),signature=sign(null,Buffer.from(ch.statement),readFileSync(join(local,'reviewer.private.pem'))).toString('base64');
    c=govAction(reviewer,c.id,{action:'approve',revision:c.revision,statement:ch.statement,signature});c=govAction(owner,c.id,{action:'execute',revision:c.revision});
  }
  console.log(`Criado: ${reference} (${c.status}; externalEffect=false)`);
}
