'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Landmark,ShieldCheck,ArrowRight } from 'lucide-react';
import { api } from '@/lib/client';
export default function Login(){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),router=useRouter(),cache=useQueryClient();
 return <main className="gov-login"><section className="gov-login-story"><Landmark size={45}/><p className="gov-eyebrow">ARKHE GOVTECH</p><h1>Evidência antes<br/>da autoridade.</h1><p>Propostas estruturadas. Revisão independente. Operações com recibos verificáveis.</p><small>Perfil local · uma organização por instalação</small></section><section className="gov-login-form"><ShieldCheck size={34}/><h2>Acessar o GovTech</h2><p>Use a conta fornecida na configuração desta instalação.</p><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const data=new FormData(e.currentTarget);try{await api('login',{email:data.get('email'),password:data.get('password')});cache.clear();router.replace('/');}catch(err){setError(err instanceof Error?err.message:'Falha de autenticação.');}finally{setBusy(false);}}}><label className="gov-field">E-mail<input name="email" type="email" autoComplete="username" maxLength={254} required disabled={busy}/></label><label className="gov-field">Senha<input id="login-password" name="password" type="password" autoComplete="current-password" maxLength={256} required disabled={busy}/></label>{error&&<p className="gov-message error" role="alert">{error}</p>}<button className="gov-primary" disabled={busy}>{busy?'Entrando…':'Acessar ambiente'}<ArrowRight size={17}/></button></form><p className="gov-login-help">As contas são geradas por <code>pnpm run setup</code>. Consulte o arquivo privado <code>credentials.json</code> no diretório de dados. Nunca publique esse diretório ou as chaves de assinatura.</p></section></main>;
}
