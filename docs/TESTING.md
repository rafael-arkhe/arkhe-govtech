# Testes, reprodução e evidências

## Comandos

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
pnpm test:http
```

Os testes usam diretórios temporários, senhas e pares de chave recém-gerados. Não leem as contas da sua instalação e não fazem chamadas a serviços públicos. O HTTP smoke inicia um servidor de produção em uma porta livre e o encerra ao final.

## Suítes

| Arquivo/comando | Verificações |
| --- | --- |
| `tests/govtech.test.mjs` | Fluxo de propostas, papéis, campos, soma, revisão, assinatura, política, emergência, replay, journal, exportação e adulteração |
| `tests/http-security.test.mjs` | Probes, métodos, parser JSON, tamanho, cookie Secure, no-store, logout, origem, revogação e bloqueio de login |
| `tests/bootstrap.test.mjs` | Configuração por .env.local e preservação de contas existentes |
| `tests/backup.test.mjs` | Snapshot com transações confirmadas em WAL, restore, persistência, sessões removidas, recusa de sobrescrita e digest divergente |
| `scripts/http-smoke.mjs` | Servidor standalone real, HTML, asset offline, login, cookie, estado, CSRF e logout via HTTP |
| `scripts/check-publication.mjs` | Arquivos versionados, segredos comuns e links Markdown locais |

O comando typecheck gera as definições de rotas com Next typegen antes do TypeScript, para funcionar em clone limpo sem .next. next-env.d.ts é gerado e não versionado.

O runner Node conta também o teste-pai que agrupa o fluxo GovTech. Não confundir quantidade de testes com número de asserts ou cobertura total de segurança.

## Negativos importantes

- Requisição sem sessão ou com origem externa não altera estado.
- Reviewer não cria processos, e author não administra configurações.
- Um autor não aprova a própria proposta; assinatura falsa ou chave divergente não aprova.
- Itens fracionários, negativos, fonte inválida ou soma acima da alçada são rejeitados.
- Mudança de configuração entre aprovação e execução exige nova revisão.
- Parada ativa bloqueia efeito, e retomada não restaura silenciosamente uma aprovação antiga.
- Replay com revisão atual não cria outro recibo; revisão antiga retorna conflito.
- Alterar conteúdo, prova, assinatura, recibo ou sequência não valida contra o checkpoint original.
- Plano sem evidência suficiente não aceita estado documentado; revisão antiga não sobrescreve novo plano.
- Restauração não substitui um diretório existente ou aceita arquivo com digest alterado.

## Procedimento de verificação visual

Use uma instalação separada. Execute setup e, opcionalmente, o seed sintético. Teste login, navegação, cadastro, revisão com outra conta, confirmação de execução, dossiê, exportação, verificação, políticas e plano. Teste ao menos um breakpoint móvel, foco, Escape e estados de erro. Registre navegador, dimensões, versão e dados usados.

A extração altera o shell/login e o adaptador HTTP, mas preserva os componentes e domínio GovTech. A demonstração histórica do vídeo documenta a versão integrada; o relatório desta distribuição registra apenas os testes efetivamente executados no pacote independente.

## CI

`.github/workflows/ci.yml` executa install congelado, auditoria de publicação, testes, tipos, build e HTTP smoke em Node 24/Linux. O workflow não contém credenciais de sistemas públicos, não faz deploy e usa permissão de leitura de conteúdo.

Um workflow configurado não significa CI aprovado. O resultado remoto deve ser consultado na aba Actions após a publicação. Build Docker e ambiente Windows/Linux específicos só são considerados validados se registrados no relatório.

## Fora da cobertura

Não há pentest independente, certificação, carga sustentada, teste de falha de energia, verificação formal do checker, autoridade temporal, restauração off-host, garantia de isolamento entre instituições ou integração estatal real. A disponibilidade/segurança de fornecedores externos não é exercitada.

O [relatório de publicação](VALIDATION.md) separa resultados locais de condições não verificadas.
