// Web Crypto only: no network or application session.
export async function verifyGovBundle(bundle, trustedCheckpoint, cryptoApi = globalThis.crypto) {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const sha = async value => Array.from(new Uint8Array(await cryptoApi.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  assert(bundle?.format==='arkhe-govtech/local-evidence/v1','Formato não suportado.');
  assert(/^[a-f0-9]{64}$/.test(trustedCheckpoint),'Informe o checkpoint retido fora deste pacote.');
  assert(Array.isArray(bundle.events)&&bundle.events.length>0&&bundle.events.length<=100000,'Cadeia ausente ou grande demais.');
  let previous='0'.repeat(64),seq=0; const history=[];
  for(const e of bundle.events) { assert(e.seq===++seq&&e.previous===previous&&await sha(e.previous+'\n'+e.payload)===e.hash,'Cadeia alterada ou incompleta.');previous=e.hash;history.push(JSON.parse(e.payload)); }
  assert(previous===bundle.checkpoint&&previous===trustedCheckpoint,'Checkpoint divergente.');
  const c=bundle.case;
  assert(c&&Array.isArray(c.items)&&c.items.length>0&&c.items.length<=256,'Proposta inválida.');
  const digest=await sha(JSON.stringify({domain:'arkhe-govtech/proposal/v1',id:c.id,agency:c.agency,kind:c.kind,title:c.title,reference:c.reference,body:c.body,items:c.items,sourceDigest:c.sourceDigest,authorId:c.authorId}));
  assert(digest===c.digest,'Conteúdo da proposta alterado.');
  const events=history.filter(e=>e.caseId===c.id),last=events.at(-1);
  assert(last?.caseDigest===await sha(JSON.stringify(c)),'Snapshot do processo divergente da cadeia.');
  assert(events[0]?.action==='created'&&events[0]?.proposalDigest===digest,'Criação não vinculada à cadeia.');
  assert((last.status||'draft')===c.status&&last.proposalDigest===digest,'Estado sem evidência correspondente.');
  if(c.proof) {
    const p=c.proof; assert(p.proposalDigest===digest&&p.prefixTotals.length===c.items.length+1&&p.prefixTotals[0]===0,'Prova inválida.');
    let sum=0; for(let i=0;i<c.items.length;i++){const n=c.items[i].amount;assert(Number.isSafeInteger(n)&&n>=0,'Valor inválido.');sum+=n;assert(Number.isSafeInteger(sum)&&p.prefixTotals[i+1]===sum,'Passo aritmético inválido.');}
    assert(sum===p.total&&sum<=p.limit&&p.policyDigest===last.policyDigest,'Conclusão ou política divergente.');
  }
  if(c.review) {
    assert(JSON.stringify(last.review)===JSON.stringify(c.review),'Revisão divergente da cadeia.');
    const r=c.review,s=JSON.parse(r.statement);assert(s.domain==='arkhe-govtech/review/v1'&&s.proposalDigest===digest&&s.caseId===c.id&&s.policyDigest===c.proof.policyDigest&&s.reviewer!==c.authorId&&s.verdict==='approve','Assinatura sem vínculo à proposta.');
    const decode=v=>Uint8Array.from(atob(v),ch=>ch.charCodeAt(0));
    const key=await cryptoApi.subtle.importKey('spki',decode(r.publicKey.replace(/-----[^-]+-----|\s/g,'')),{name:'Ed25519'},false,['verify']);
    assert(await cryptoApi.subtle.verify('Ed25519',key,decode(r.signature),new TextEncoder().encode(r.statement)),'Assinatura inválida.');
  }
  if(c.status==='authorized'||c.status==='executed') assert(c.review,'Revisão obrigatória ausente.');
  if(c.status==='executed') assert(c.receipt?.externalEffect===false&&c.receipt.proposalDigest===digest&&JSON.stringify(last.receipt)===JSON.stringify(c.receipt),'Recibo sem vínculo.');
  return {valid:true,events:bundle.events.length,status:c.status,proposalDigest:digest,scope:'Integridade local e assinatura vinculada ao checkpoint informado. Não valida poderes jurídicos, fonte dos insumos ou ato estatal.'};
}
