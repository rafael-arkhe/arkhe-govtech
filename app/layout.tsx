import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { AuthShell } from '@/components/auth-shell';
import './base.css';
import './govtech.css';
export const metadata:Metadata={title:{default:'Arkhe GovTech',template:'%s | Arkhe GovTech'},description:'Propostas, revisão humana, autorização e evidências verificáveis. Perfil local de validação.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Providers><AuthShell>{children}</AuthShell></Providers></body></html>;}
