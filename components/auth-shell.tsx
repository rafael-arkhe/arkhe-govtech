'use client';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { Landmark } from 'lucide-react';
import { api } from '@/lib/client';
type User={id:string;name:string;role:string};
export function AuthShell({children}:{children:React.ReactNode}){
  const path=usePathname(),router=useRouter(),cache=useQueryClient(),[error,setError]=useState('');
  const me=useQuery({queryKey:['me'],queryFn:()=>api<User>('me'),enabled:path!=='/login'});
  if(path==='/login')return <>{children}</>;
  if(me.isPending)return <main className="gov-loading" role="status">Abrindo o Arkhe GovTech…</main>;
  if(!me.data)return <main className="gov-access"><Landmark size={42}/><h1>Arkhe GovTech</h1><p>Entre para acessar processos, políticas e evidências.</p><Link className="gov-primary" href="/login">Entrar no GovTech</Link></main>;
  return <><a className="skip" href="#conteudo">Pular para o conteúdo</a><div className="gov-account-bar"><Link href="/">Arkhe GovTech</Link><span>{me.data.name} · {me.data.role==='owner'?'Governança':me.data.role==='reviewer'?'Revisão':'Autoria'}</span><button onClick={async()=>{try{await api('logout',{});cache.clear();router.replace('/login');}catch(e){setError(e instanceof Error?e.message:'Falha ao encerrar a sessão.');}}}>Sair</button></div>{error&&<p role="alert">{error}</p>}<main id="conteudo">{children}</main></>;
}
