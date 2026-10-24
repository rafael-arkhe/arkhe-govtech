# Origem e extração independente

## Objetivo

Publicar o aplicativo GovTech em um repositório próprio e executável, sem exigir o ambiente de desenvolvimento completo do Arkhe. A fonte de origem foi o módulo `apps/arkhe-intra` do workspace autorizado pelo usuário; essa é uma referência arquitetural, não um caminho exigido na instalação atual.

## Preservado

Componentes dos nove módulos, formulários, operações, tipos, verificador Web Crypto/HTML e domínio de processos/políticas/plano. Os identificadores de formato, digests de proposta e eventos, assinatura de revisão e OperationId permanecem próprios do perfil GovTech.

## Adaptado

| Área | Versão integrada | Distribuição independente |
| --- | --- | --- |
| Entrada | `/govtech` dentro do Intra | `/`, com alias `/govtech` |
| Shell/login | Navegação e serviços do Intra | Shell e login exclusivos do GovTech |
| Sessão | Cookie compartilhado do Intra | Cookie `govtech_session` |
| Contas | Bootstrap + extensões de matrícula do Intra | Somente bootstrap local validado |
| Banco | Banco e tabelas do Intra | `govtech.sqlite`, auth e tabelas GovTech |
| Criptografia server | Módulo misto do Intra | Verificação Ed25519 nativa, sem importação do WASM |
| Raiz de execução | Descoberta do monorepo | Caminhos/configuração do próprio pacote |
| Inicialização | Script/porta do Intra | Launcher próprio e configuração standalone |
| Backup | Procedimentos de outro produto | Scripts locais com manifesto e restore em novo destino |
| Testes | Suíte ampla do Intra | Suítes independentes e HTTP de produção |

## Excluído do escopo

Outros módulos do Intra/Enterprise, billing, recuperação de conta pela interface, matrícula de credenciais, assistente Ollama, avaliação cognitiva, preview/sandbox, adapters de terceiros, crates Rust, PostgreSQL, executáveis de distribuição Windows e dependências vendorizadas. Eles não eram capacidades do fluxo GovTech local e não são publicados como dependências implícitas.

Também não foram copiados `.env.local`, `.env.production.local`, bancos ativos, arquivos de contas, chaves privadas, tokens, diretórios `node_modules` ou `.next`. O vídeo não expõe senhas ou conteúdo de chaves privadas.

## Migração de dados

Não há migração automática do banco integrado para este banco. Não copie `intra.sqlite` renomeando-o. Se for necessário transportar registros existentes, faça um projeto de migração que preserve bytes/ordem de JSON, identidades, revisão, cadeia, chaves e checkpoints, com validação independente antes de ativar a instalação.

Os pacotes já exportados no perfil `arkhe-govtech/local-evidence/v1` podem ser conferidos pelo verificador correspondente, desde que acompanhados de checkpoint confiável. Isso não equivale a importá-los para o novo banco.

## Histórico de validação

A versão integrada teve 88 testes do Intra aprovados durante a ampliação. Esse total incluía módulos excluídos. A distribuição independente possui uma suíte própria e não usa o número histórico como alegação de cobertura atual.

O vídeo foi produzido antes da extração. Ele demonstra o comportamento GovTech preservado e pode exibir elementos do shell integrado. O README e o guia explicam as diferenças de inicialização e autenticação.
