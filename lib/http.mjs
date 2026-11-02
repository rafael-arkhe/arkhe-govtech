import { login,session,logout } from './auth.mjs';
import { readiness } from './store.mjs';
import { govState,govCreate,govSettings,govPilot,govChallenge,govAction,govExport,govAfir } from './govtech.mjs';
import { afirReady } from './afir.mjs';
import { observeRequest,operationRoute,metricsAuthorized,metricsResponse } from './observability.mjs';
export const origin=()=>process.env.GOVTECH_ORIGIN||'http://127.0.0.1:3012';
const demand=(condition,status,message)=>{if(!condition)throw Object.assign(new Error(message),{status});};
const cookie=request=>/(?:^|;\s*)govtech_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];
const json=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}});
async function body(request){
  demand(request.headers.get('content-type')?.split(';')[0]==='application/json',415,'Envie JSON.');
  const reader=request.body?.getReader();demand(reader,400,'Corpo ausente.');const chunks=[];let length=0;
  for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>262144){await reader.cancel();demand(false,413,'Requisição maior que 256 KiB.');}chunks.push(value);}
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{demand(false,400,'JSON inválido.');}
  demand(value&&typeof value==='object'&&!Array.isArray(value),400,'Envie um objeto JSON.');return value;
}
async function dispatch(request,segments){
  try{
    const path=segments.join('/'),method=request.method;
    demand(['GET','POST'].includes(method),405,'Método não permitido.');
    if(method!=='GET')demand(request.headers.get('origin')===origin(),403,'Origem inválida. Use a origem configurada.');
    if(path==='health'&&method==='GET')return json({status:'ok',service:'arkhe-govtech',mode:'synthetic'});
    if(path==='ready'&&method==='GET'){const ok=readiness();return json({status:ok?'ready':'not-ready'},ok?200:503);}
    if(path==='metrics'&&method==='GET'&&metricsAuthorized(request))return metricsResponse();
    if(path==='login'&&method==='POST'){
      const data=await body(request);demand(typeof data.email==='string'&&data.email.length<=254&&typeof data.password==='string'&&data.password.length<=256,400,'Credenciais inválidas.');
      const result=login(data.email,data.password);
      return json(result.user,200,{'Set-Cookie':`govtech_session=${result.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${origin().startsWith('https:')?'; Secure':''}`});
    }
    const user=session(cookie(request));demand(user,401,'Entre com sua conta para continuar.');
    if(path==='me'&&method==='GET')return json(user);
    if(path==='logout'&&method==='POST'){logout(cookie(request));return json({ok:true},200,{'Set-Cookie':`govtech_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${origin().startsWith('https:')?'; Secure':''}`});}
    if(path==='metrics'&&method==='GET'){demand(user.role==='owner',403,'Métricas exigem governança.');return metricsResponse();}
    if(path==='govtech'&&method==='GET')return json(govState(user));
    if(path==='govtech/cases'&&method==='POST')return json(govCreate(user,await body(request)),201);
    if(path==='govtech/settings'&&method==='POST')return json(govSettings(user,await body(request)));
    if(path==='govtech/pilot'&&method==='POST')return json(govPilot(user,await body(request)));
    if((path==='govtech/afir/bundle'||path==='govtech/afir/trust')&&method==='GET'){await afirReady();return json(govAfir(user,segments[2]),200,segments[2]==='bundle'?{'Content-Disposition':'attachment; filename="arkhe-govtech-afir-bundle.json"'}:{});}
    if(segments[0]==='govtech'&&segments[1]==='cases'&&/^[a-f0-9-]{36}$/.test(segments[2]||'')&&segments.length===4){
      const id=segments[2];
      if(segments[3]==='challenge'&&method==='GET')return json(govChallenge(user,id));
      if(segments[3]==='action'&&method==='POST'){await afirReady();return json(govAction(user,id,await body(request)));}
      if(segments[3]==='export'&&method==='GET')return json(govExport(user,id),200,{'Content-Disposition':`attachment; filename="arkhe-govtech-${id}.json"`});
    }
    demand(false,404,'Rota não encontrada.');
  }catch(error){return json({error:error.status?error.message:'Serviço indisponível. Consulte os logs locais.'},error.status||503);}
}
export async function handle(request,segments=[]){
  const started=performance.now(),response=await dispatch(request,segments);
  observeRequest({route:operationRoute(segments),method:request.method,status:response.status,duration:(performance.now()-started)/1000});return response;
}
