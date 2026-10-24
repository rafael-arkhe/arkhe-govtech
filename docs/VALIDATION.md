# Relatório de publicação — 24/10/2026

## Distribuição independente

| Verificação | Resultado observado |
| --- | --- |
| Instalação de dependências | pnpm 11.25.0, lockfile próprio, sem dependências do workspace original |
| Testes independentes | 17 testes passaram, zero falhas, zero skips |
| TypeScript | `tsc --noEmit` passou |
| Build Next.js | Build de produção passou; distribuição standalone gerada |
| HTTP real | Smoke do servidor standalone passou com diretório e contas temporários |
| Backup/restore | Teste passou com WAL confirmado, manifesto, restore em novo destino e recusa de adulteração |
| OpenAPI | YAML carregado e referências locais resolvidas para 13 rotas |
| YAML operacional | Workflow/Compose carregados sintaticamente |

O HTTP smoke confere HTML, asset offline, bloqueio sem sessão, login, estado inicial, origem incorreta e logout. O processo de teste é encerrado ao final. Nenhum teste invoca sistemas públicos.

A revisão visual e o vídeo da origem integrada documentam os componentes GovTech preservados. O pacote independente foi verificado por tipos, build e HTTP; isso não deve ser descrito como uma nova auditoria completa de navegador/acessibilidade.

## Evidência histórica

A versão integrada teve fluxo completo exercitado no navegador e 88 testes do Intra aprovados. Esse total não se aplica à suíte independente, pois incluía módulos excluídos. O vídeo de 7min15s possui 19 capítulos, áudio e legendas; sua decodificação integral foi conferida sem erros na preparação original.

## Limites

- Workflow entregue; resultado remoto deve ser conferido no GitHub Actions após publicação.
- Receita Docker/Compose entregue, sem alegação de build/executar Docker nesta etapa.
- Não há validação de identidade institucional, sistemas públicos, TEE/HSM ou política jurídica real.
- Não há pentest, verificação formal do checker, testes de carga ou implantação de produção.
- O scanner de publicação é heurístico; revisão manual continua necessária.

## Auditoria de publicação

Antes do commit, são inspecionados os arquivos versionados, links Markdown e padrões comuns de credenciais. `.data`, `.env` reais, contas, chaves privadas, bancos, dependências e build são ignorados. O repositório contém somente código, configuração de exemplo, documentação, testes e mídia demonstrativa selecionada.

As falhas do gate de arquitetura do antigo monorepo não são transferidas como requisito deste pacote: este possui lockfile, paths, build e testes próprios. Isso não significa que os componentes Rust pendentes do monorepo foram corrigidos.
