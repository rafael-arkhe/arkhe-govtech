'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="gov-access"><h1>Não foi possível carregar o ambiente</h1><p>Confira a configuração local e tente novamente.</p><button className="gov-primary" onClick={reset}>Tentar novamente</button></main>;}
