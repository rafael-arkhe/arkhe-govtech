# Modelo de segurança e limitações

## Ativos e confiança

Ativos: propostas, dados de fonte declarados, políticas, assinaturas, chaves privadas, contas, sessões, journal, cadeia e checkpoints retidos pelo auditor. O operador administra host, arquivos, relógio, build e dependências. Usuários e documentos de entrada não são confiáveis por padrão.

Há uma organização por instalação. Um órgão não é uma fronteira de confidencialidade. Owner/reviewer podem ver todos os processos, inclusive rascunhos. Author vê apenas os próprios; contagens globais de eventos não são uma separação de tenants.

## Controles implementados

| Ameaça | Controle | Limite |
| --- | --- | --- |
| Operação sem sessão | Middleware HTTP consulta sessão antes do domínio | Conta/host maliciosos estão fora da fronteira |
| CSRF em escrita | Origin exata em POST; cookie SameSite=Strict | Depende da configuração correta da origem e proteção contra XSS |
| Senha adivinhada | scrypt com salt e limite por e-mail normalizado | Não há proteção distribuída, por IP ou contra todos os padrões de DoS |
| Sessão exposta no DB | Apenas hash SHA-256 do token é persistido | Roubo do cookie do navegador continua relevante |
| Sessão acessível a JS | HttpOnly; Secure quando origem é HTTPS | HTTP é reservado ao laboratório/loopback |
| Autoaprovação | Ator autenticado diferente do proponente | Duas contas não provam duas pessoas físicas |
| Assinatura falsa | Ed25519 nativa contra chave da conta | Cadastro local não é ICP-Brasil |
| Troca de parâmetros | Compromissos de conteúdo/política e revisão otimista | Fonte e política podem ser semanticamente incorretas |
| Política alterada entre revisão e efeito | Revalidação e igualdade de revisão/configuração | Autorização não possui prazo autônomo de despacho |
| Duplicata local | Journal único e transação síncrona | Não oferece exactly-once remoto |
| Adulteração de pacote | Cadeia, snapshot e assinatura sob checkpoint confiável | Operador pode fabricar outra cadeia se auditor não reteve a raiz |
| Atualização de eventos | Triggers de append-only | Administrador pode modificar schema/arquivo |
| Payload excessivo | JSON HTTP até 256 KiB; limites de campos/itens | Não há orçamento global de CPU/memória por conta |
| Vazamento em erro | Mensagens genéricas em falha inesperada | Logs/infraestrutura do operador exigem proteção própria |

## Autenticação

O setup gera senhas aleatórias de 18 bytes em base64url, salt de 16 bytes e derivação scrypt de 64 bytes. O login usa comparação com tempo constante e uma derivação mesmo para conta inexistente. Dez falhas por e-mail bloqueiam novas tentativas daquele identificador por até 15 minutos.

Tokens de sessão têm 32 bytes aleatórios e validade de oito horas. O cookie se chama `govtech_session`, evitando reutilizar o nome do cookie do Intra; portas diferentes no mesmo host não são fronteiras de cookies. Cada requisição relê a conta e recusa `revoked:true`.

Não há MFA, SSO, reset de senha, matrícula de novas contas pela interface ou rotação automática de chaves. Arquivos de bootstrap são administração local e devem ter acesso restrito. Chaves e `credentials.json` de demonstração não devem existir em uma publicação Git.

## Assinaturas e revogação

A revisão usa chave privada no navegador e envia apenas assinatura e statement. O setup de laboratório conserva cópia da chave no host; não equivale a token criptográfico, HSM ou posse exclusiva do revisor.

Revogar uma conta bloqueia suas sessões seguintes. A execução não consulta novamente a situação de todos os revisores de aprovações históricas; ela confere a revisão/política armazenadas e as regras do fluxo. Um processo de revogação institucional e reavaliação de autorizações é pendente. O relógio do host controla expiração do desafio; não há carimbo de tempo externo.

## Frontend e rede

Headers incluem `nosniff`, `DENY` para frames, política de referrer e CSP. A CSP mantém `unsafe-inline` e permissão de WASM herdada da configuração do app; isso não é uma CSP estrita baseada em nonce. A página offline limita `connect-src` a `none` via meta CSP. O aplicativo normal continua fazendo consultas à sua API.

O React renderiza campos como texto, sem `dangerouslySetInnerHTML`. Não há fetch de links de evidência ou conteúdo de fontes pelo servidor. Atualizações futuras que consumam URLs precisam de controles SSRF, tempo e tamanho próprios.

## Custódia e privacidade

Pacotes incluem a cadeia de toda a instalação. Não há redação seletiva, minimização automática, prazo de retenção, eliminação segura, criptografia de banco ou isolamento entre órgãos. Append-only deve ser conciliado com requisitos concretos de retenção e proteção de dados antes de um piloto.

Segredos em `.env.local` são ignorados no Git. O token opcional de métricas é comparado sem expor seu valor e precisa ter pelo menos 32 caracteres. Restrinja acesso ao endpoint e ao reverse proxy; não trate métricas por processo como um sistema de monitoração completo.

## Qualificação necessária antes de efeitos reais

Identidade e mandato, papéis institucionais, autenticação forte, atualização/revogação de poderes, política temporal, fontes oficiais, saldo autoritativo, conectores com idempotência, custódia externa de checkpoints, recuperação, observabilidade, testes adversariais e revisão independente. A presença de código de segurança não demonstra conformidade integral com LGPD, AI Act ou normas de contratação.

Veja [SECURITY](../SECURITY.md) para relatar um problema sem publicar dados sensíveis.
