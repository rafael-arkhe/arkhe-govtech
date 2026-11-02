import { createHash, randomUUID } from 'node:crypto';
import { db, transaction } from './store.mjs';
import { verifySignature } from './crypto.mjs';
const fail = (ok, status, message) => { if (!ok) throw Object.assign(new Error(message), { status }); };
const hash = value => createHash('sha256').update(value).digest('hex');
const zero = '0'.repeat(64);
export const agencies = [{ id:'administracao', name:'Secretaria de Administração', short:'SEAD' }, { id:'fazenda', name:'Secretaria da Fazenda', short:'SEFAZ' }, { id:'inovacao', name:'Secretaria de Ciência e Tecnologia', short:'SECTI' }];
export const kinds = [{ id:'despesa', name:'Liquidação de despesa', target:'SIAFE · simulador' }, { id:'licitacao', name:'Triagem de licitação', target:'e-GP · simulador' }, { id:'atendimento', name:'Atendimento ao cidadão', target:'gov.br · simulador' }];
const elevated = user => ['owner','reviewer'].includes(user.role);
function init() {
  db().exec(`CREATE TABLE IF NOT EXISTS gov_config(id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS gov_pilot(id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS gov_cases(id TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS gov_journal(operation_id TEXT PRIMARY KEY, case_id TEXT NOT NULL UNIQUE REFERENCES gov_cases(id), value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS gov_events(seq INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL, payload TEXT NOT NULL, previous TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS gov_event_no_update BEFORE UPDATE ON gov_events BEGIN SELECT RAISE(ABORT,'append only'); END;
    CREATE TRIGGER IF NOT EXISTS gov_event_no_delete BEFORE DELETE ON gov_events BEGIN SELECT RAISE(ABORT,'append only'); END;`);
  const value = { revision:1, stopped:false, policies:agencies.map(a => ({ agency:a.id, limit:10000000, humanAbove:500000, maxItems:256 })) };
  db().prepare('INSERT OR IGNORE INTO gov_config VALUES(1,?)').run(JSON.stringify(value));
  db().prepare('INSERT OR IGNORE INTO gov_pilot VALUES(1,?)').run(JSON.stringify({revision:1,owner:'',targetDate:'',notes:'',controls:['problem','identity','connector','data','recovery'].map(id=>({id,state:'pending',evidence:''}))}));
}
const config = () => JSON.parse(db().prepare('SELECT value FROM gov_config WHERE id=1').get().value);
const save = c => db().prepare('INSERT INTO gov_cases VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(c.id,JSON.stringify(c));
const all = () => db().prepare('SELECT value FROM gov_cases ORDER BY rowid DESC').all().map(r=>JSON.parse(r.value));
function read(user,id) { const c=all().find(c=>c.id===id); fail(c && (elevated(user)||c.authorId===user.id),404,'Processo não encontrado.'); return c; }
function append(user,action,c,payload={}) {
  const previous=db().prepare('SELECT hash FROM gov_events ORDER BY seq DESC LIMIT 1').get()?.hash||zero;
  const value=JSON.stringify({domain:'arkhe-govtech/event/v1',at:new Date().toISOString(),actor:user.id,action,caseId:c?.id||null,caseDigest:c?hash(JSON.stringify(c)):null,...payload});
  db().prepare('INSERT INTO gov_events(case_id,payload,previous,hash) VALUES(?,?,?,?)').run(c?.id||'',value,previous,hash(previous+'\n'+value));
}
const commitment = c => hash(JSON.stringify({ domain:'arkhe-govtech/proposal/v1',id:c.id,agency:c.agency,kind:c.kind,title:c.title,reference:c.reference,body:c.body,items:c.items,sourceDigest:c.sourceDigest,authorId:c.authorId }));
function validate(user,c,cfg=config()) {
  const p=cfg.policies.find(p=>p.agency===c.agency);
  fail(!cfg.stopped,409,'Parada de emergência ativa.');
  fail(p,409,'Política do órgão ausente.');
  fail(c.items.length<=p.maxItems,400,'Quantidade de itens acima da política.');
  const total=c.items.reduce((s,i)=>s+i.amount,0);
  fail(Number.isSafeInteger(total)&&total<=p.limit,409,'Valor total acima da alçada permitida.');
  fail(commitment(c)===c.digest,409,'Proposta divergente do compromisso.');
  return {domain:'arkhe-govtech/budget-check/v1',algorithm:'sha256',policyDigest:hash(JSON.stringify(p)),policyRevision:cfg.revision,proposalDigest:c.digest,total,limit:p.limit,humanRequired:true,prefixTotals:c.items.reduce((a,i)=>[...a,a.at(-1)+i.amount],[0]),scope:'Aritmética local; não comprova autenticidade ou legalidade dos insumos.'};
}
function text(value,min,max,name) { fail(typeof value==='string'&&value.trim().length>=min&&value.length<=max,400,`Campo ${name} inválido.`);return value.trim(); }
export function govState(user) {
  init(); const cfg=config(), cases=all().filter(c=>elevated(user)||c.authorId===user.id);
  const logs=db().prepare('SELECT * FROM gov_events ORDER BY seq').all(); let previous=zero;
  const integrity=logs.every(e=>{const valid=e.previous===previous&&hash(e.previous+'\n'+e.payload)===e.hash;previous=e.hash;return valid;});
  return {user,agencies,kinds,config:cfg,cases,pilot:elevated(user)?JSON.parse(db().prepare('SELECT value FROM gov_pilot WHERE id=1').get().value):null,integrity,eventCount:logs.length,events:elevated(user)?logs.slice(-100).reverse().map(e=>({...e,event:JSON.parse(e.payload)})):[],journal:db().prepare('SELECT value FROM gov_journal ORDER BY rowid DESC').all().map(r=>JSON.parse(r.value)).filter(j=>cases.some(c=>c.id===j.caseId)),mode:'synthetic',organizationMode:'single-org',connectors:[{name:'SIAFE / e-GP / SEI',state:'Simulado',detail:'Execução local persistente; nenhum ato enviado ao Estado.'},{name:'gov.br / ICP-Brasil',state:'Pendente',detail:'Sessão local e assinatura Ed25519; sem identidade jurídica validada.'},{name:'TEE / HSM nacional',state:'Pendente',detail:'Infraestrutura protegida não provisionada.'},{name:'SCITT / WIMSE / pós-quântica',state:'Planejado',detail:'Sem declaração de conformidade ou envelope híbrido.'}]};
}
export function govPilot(user,input) {
  init();fail(user.role==='owner',403,'Plano de piloto exige governança.');
  return transaction(()=>{const old=JSON.parse(db().prepare('SELECT value FROM gov_pilot WHERE id=1').get().value);
    fail(input.revision===old.revision,409,'Plano alterado; recarregue a página.');
    fail(typeof input.owner==='string'&&input.owner.length<=160&&typeof input.notes==='string'&&input.notes.length<=4000,400,'Responsável ou observações inválidos.');
    fail(typeof input.targetDate==='string'&&(input.targetDate===''||(/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)&&!Number.isNaN(Date.parse(input.targetDate))&&new Date(input.targetDate).toISOString().slice(0,10)===input.targetDate)),400,'Data inválida.');
    fail(Array.isArray(input.controls)&&input.controls.length===5,400,'Informe os cinco controles.');
    const controls=old.controls.map(({id})=>{const matches=input.controls.filter(c=>c?.id===id);fail(matches.length===1,400,'Controle ausente ou duplicado.');const c=matches[0];fail(['pending','progress','documented'].includes(c.state)&&typeof c.evidence==='string'&&c.evidence.length<=1500,400,'Controle inválido.');fail(c.state!=='documented'||c.evidence.trim().length>=15,400,'Controle documentado exige referência de evidência.');return {id,state:c.state,evidence:c.evidence.trim()};});
    const value={revision:old.revision+1,owner:input.owner.trim(),targetDate:input.targetDate,notes:input.notes.trim(),controls,updatedAt:new Date().toISOString(),updatedBy:user.id};
    db().prepare('UPDATE gov_pilot SET value=? WHERE id=1').run(JSON.stringify(value));append(user,'pilot-updated',null,{revision:value.revision});return value;
  });
}
export function govCreate(user,input) {
  init(); fail(['owner','author'].includes(user.role),403,'A criação exige autoria ou governança.');
  fail(agencies.some(a=>a.id===input.agency)&&kinds.some(k=>k.id===input.kind),400,'Órgão ou modalidade inválidos.');
  fail(Array.isArray(input.items)&&input.items.length>0&&input.items.length<=256,400,'Informe de 1 a 256 itens.');
  const items=input.items.map(i=>{fail(i&&Number.isSafeInteger(i.amount)&&i.amount>=0&&i.amount<=100000000,400,'Valores devem ser centavos inteiros não negativos.');return {label:text(i.label,1,120,'descrição do item'),amount:i.amount};});
  fail(Number.isSafeInteger(items.reduce((s,i)=>s+i.amount,0)),400,'Soma fora do domínio permitido.');
  const c={id:randomUUID(),agency:input.agency,kind:input.kind,title:text(input.title,4,180,'título'),reference:text(input.reference,3,100,'referência'),body:text(input.body,10,12000,'justificativa'),sourceDigest:text(input.sourceDigest,64,64,'SHA-256 da fonte'),items,authorId:user.id,createdAt:new Date().toISOString(),revision:1,status:'draft',review:null,receipt:null};
  fail(/^[a-f0-9]{64}$/.test(c.sourceDigest),400,'Digest da fonte inválido.');c.digest=commitment(c);
  return transaction(()=>{save(c);append(user,'created',c,{proposalDigest:c.digest});return c;});
}
export function govSettings(user,input) {
  init(); fail(user.role==='owner',403,'Configuração exige governança.');
  return transaction(()=>{ const cfg=config();fail(input.revision===cfg.revision,409,'Configuração alterada; atualize a página.');
    if(input.action==='stop') {fail(typeof input.stopped==='boolean',400,'Estado de parada inválido.');cfg.stopped=input.stopped;}
    else if(input.action==='policy') {
      const p=cfg.policies.find(p=>p.agency===input.agency);fail(p,400,'Órgão inválido.');
      fail(Number.isSafeInteger(input.limit)&&input.limit>=0&&input.limit<=10000000000&&Number.isSafeInteger(input.humanAbove)&&input.humanAbove>=0&&input.humanAbove<=input.limit,400,'Alçadas inválidas.');
      p.limit=input.limit;p.humanAbove=input.humanAbove;
    } else fail(false,400,'Ação inválida.');
    cfg.revision++;db().prepare('UPDATE gov_config SET value=? WHERE id=1').run(JSON.stringify(cfg));append(user,input.action==='stop'?'emergency-stop':'policy-updated',null,{revision:cfg.revision,stopped:cfg.stopped,agency:input.agency||null});return cfg;
  });
}
export function govChallenge(user,id) {
  init(); const c=read(user,id);fail(elevated(user)&&user.id!==c.authorId,403,'A revisão exige pessoa diferente do proponente.');
  fail(c.status==='review',409,'Processo não está em revisão.'); const proof=validate(user,c);
  const statement=JSON.stringify({domain:'arkhe-govtech/review/v1',caseId:c.id,revision:c.revision,proposalDigest:c.digest,policyDigest:proof.policyDigest,policyRevision:proof.policyRevision,reviewer:user.id,verdict:'approve',expires:Date.now()+300000});
  return {statement,proof};
}
export function govAction(user,id,input) {
  init(); return transaction(()=>{
    const c=read(user,id);fail(input.revision===c.revision,409,'Processo alterado; atualize antes de continuar.');
    if(input.action==='submit') {
      fail(user.id===c.authorId&&c.status==='draft',403,'Somente o autor pode enviar um rascunho.');
      c.proof=validate(user,c);c.status='review';
    } else if(input.action==='approve') {
      fail(elevated(user)&&user.id!==c.authorId,403,'A revisão exige pessoa diferente do proponente.');fail(c.status==='review',409,'Estado inválido para aprovação.');
      const proof=validate(user,c); let s;try{s=JSON.parse(input.statement);}catch{fail(false,400,'Desafio inválido.');}
      fail(s&&typeof s==='object'&&!Array.isArray(s),400,'Desafio inválido.');
      fail(s.domain==='arkhe-govtech/review/v1'&&s.caseId===id&&s.revision===c.revision&&s.proposalDigest===c.digest&&s.policyDigest===proof.policyDigest&&s.policyRevision===proof.policyRevision&&s.reviewer===user.id&&s.verdict==='approve'&&Number.isSafeInteger(s.expires)&&s.expires>Date.now()&&s.expires<=Date.now()+300000,409,'Desafio expirado ou divergente.');
      fail(verifySignature(input.statement,input.signature,user.publicKey),403,'Assinatura Ed25519 inválida.');
      c.review={statement:input.statement,signature:input.signature,publicKey:user.publicKey,reviewer:user.id,at:new Date().toISOString()};c.proof=proof;c.status='authorized';
    } else if(input.action==='reject') {
      fail(elevated(user)&&user.id!==c.authorId&&c.status==='review',403,'Rejeição exige revisão independente.');
      c.rejection=text(input.reason,5,1000,'motivo');c.status='rejected';
    } else if(input.action==='execute') {
      fail(user.role==='owner',403,'Execução exige governança.');
      if(c.status==='executed') return c;
      fail(c.status==='authorized',409,'Processo sem autorização.');const proof=validate(user,c);
      fail(c.review&&c.proof.policyRevision===proof.policyRevision&&c.proof.policyDigest===proof.policyDigest,409,'Política alterada; solicite nova revisão.');
      // Local effect + journal + evidence share one SQLite transaction. No remote exactly-once claim.
      const operationId=hash('arkhe-govtech/operation/v1\n'+c.id+'\n'+c.digest);
      c.receipt={domain:'arkhe-govtech/synthetic-receipt/v1',operationId,caseId:c.id,proposalDigest:c.digest,policyDigest:proof.policyDigest,target:kinds.find(k=>k.id===c.kind).target,total:proof.total,at:new Date().toISOString(),externalEffect:false};
      db().prepare('INSERT INTO gov_journal VALUES(?,?,?)').run(operationId,c.id,JSON.stringify(c.receipt));
      c.status='executed';
    } else if(input.action==='resubmit') {
      fail(user.id===c.authorId&&c.status==='authorized',403,'Somente o autor pode solicitar nova revisão.');c.review=null;c.proof=validate(user,c);c.status='review';
    } else fail(false,400,'Ação inválida.');
    c.revision++;save(c);append(user,input.action,c,{status:c.status,proposalDigest:c.digest,policyDigest:c.proof?.policyDigest||null,review:c.review,receipt:c.receipt,reason:c.rejection||null});return c;
  });
}
export function govExport(user,id) {
  init();const c=read(user,id);
  // The prefix is needed to verify a shared hash chain. Only governance/review can export it.
  fail(elevated(user),403,'Exportação da cadeia exige revisão ou governança.');
  const events=db().prepare('SELECT seq,payload,previous,hash FROM gov_events ORDER BY seq').all();
  return {format:'arkhe-govtech/local-evidence/v1',exportedAt:new Date().toISOString(),case:c,policy:config(),events,checkpoint:events.at(-1)?.hash||zero,externalAnchor:false,warning:'Cadeia SHA-256 local. Retenha o checkpoint em canal independente. Não é WER canônico, MMR, PCO Rust, ICP-Brasil ou prova de ato público.'};
}
