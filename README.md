# Arkhe GovTech

**Evidência antes da autoridade.** Aplicativo independente para propostas administrativas, revisão humana, autorização, execução simulada e verificação de evidências.

Este repositório contém o código executável do GovTech extraído do ambiente Arkhe, com autenticação e armazenamento próprios. Não requer o monorepo, Rust, PostgreSQL, Ollama, uma conta de IA ou serviços externos para o fluxo local.

> **Estado:** MVP funcional de validação local, uma organização por instalação. Órgãos são escopos de trabalho, não tenants. Sistemas públicos, ICP-Brasil, TEE/HSM e perfis de PCO/MMR Rust não estão integrados. Não executa pagamentos ou atos administrativos reais.

![Painel do aplicativo](docs/media/painel.jpg)

## Executar

Pré-requisitos: **Node.js 24.x** e **pnpm 11.25.0**. O armazenamento usa `node:sqlite`.

```sh
git clone https://github.com/rafael-arkhe/arkhe-govtech.git
cd arkhe-govtech
pnpm install --frozen-lockfile
pnpm run setup
pnpm dev
```

Abra **http://127.0.0.1:3012**. O alias `/govtech` redireciona para a página inicial.

Na primeira configuração são geradas três contas locais, com senhas aleatórias e chaves Ed25519. Consulte **`.data/credentials.json`** no seu computador. Não há senha padrão no código e nenhum segredo deve ser enviado ao GitHub. O comando de configuração preserva contas existentes.

Para a compilação e o servidor de produção local:

```sh
pnpm build
pnpm start
```

Para povoar **opcionalmente** uma instalação de laboratório com exemplos fictícios:

```sh
pnpm demo:seed --confirm-synthetic
```

O comando não desativa uma parada existente e não reescreve exemplos já cadastrados. Consulte a [instalação detalhada](docs/INSTALLATION.md) para variáveis, Windows, Linux e Docker.

## Funcionalidades

| Módulo | Comportamento |
| --- | --- |
| Visão geral | Contagens derivadas dos processos, cadeia local e ciclo de confiança |
| Processos | Cadastro de despesas, licitações e atendimento; busca, filtros e detalhe |
| Aprovações | Fila por etapa; revisão independente e rejeição motivada |
| Execuções | Cockpit, volume sintético, journal e recibos com OperationId |
| Políticas | Alçadas por órgão, versões e parada/retomada com confirmação |
| Evidências | Eventos encadeados, dossiê da operação e exportação para auditor |
| Conectividade | Estado explícito dos simuladores e integrações pendentes |
| Plano do piloto | Responsável, cinco controles, referências, versões e exportação Markdown |
| Verificar pacote | Verificação Web Crypto no cliente e página independente offline |

Modais adicionais apresentam aprovação assinada, confirmação de execução, alteração de política, emergência, edição do plano e dossiê com linha do tempo.

## Percurso de demonstração

1. Entre como **author** e crie um processo com itens e digest da fonte.
2. Envie para revisão: soma e alçada são conferidas no servidor.
3. Entre como **reviewer**, confira a proposta e assine com `reviewer.private.pem` da sua instalação. A chave privada é usada apenas no navegador.
4. Entre como **owner** e confirme a execução no simulador.
5. Inspecione o recibo e exporte o pacote. A exportação da cadeia compartilhada exige revisão ou governança.
6. Verifique o pacote em **Verificar pacote**. Em auditoria, use checkpoint retido por um canal independente.

O proponente não pode aprovar a própria proposta. Uma alteração da configuração invalida autorizações anteriores para despacho. O simulador grava efeito, recibo e evento na mesma transação SQLite.

## Vídeo

[Assistir ou baixar a demonstração completa — 7min15s](docs/media/demo-completo.mp4) · [Legendas pt-BR](docs/media/legendas.srt) · [Roteiro](docs/media/roteiro.md)

O vídeo é uma montagem narrada com capturas reais da versão integrada que originou esta distribuição. Os dados e a voz são sintéticos. A distribuição independente preserva os módulos GovTech, com login e inicialização próprios; não inclui os outros módulos do Intra.

## Verificação

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm test:http
pnpm check:publication
```

O último comando inspeciona arquivos **versionados** e links locais; use-o após `git add` ao preparar uma contribuição. A suíte independente possui seu próprio relatório: os 88 testes históricos do Intra não são apresentados como se pertencessem a este pacote.

## Documentação técnica

Comece pelo [índice completo](docs/README.md).

- [Arquitetura e fronteiras](docs/ARCHITECTURE.md)
- [Domínio, estados e permissões](docs/DOMAIN.md)
- [API HTTP](docs/API.md) e [OpenAPI](docs/openapi.yaml)
- [Banco, transações e concorrência](docs/DATA-MODEL.md)
- [Criptografia e protocolo de evidências](docs/CRYPTOGRAPHY.md)
- [Modelo de ameaças](docs/SECURITY-MODEL.md)
- [Instalação](docs/INSTALLATION.md) e [operação/recuperação](docs/OPERATIONS.md)
- [Testes e evidências de validação](docs/TESTING.md)
- [Rastreabilidade de requisitos](docs/REQUIREMENTS.md), [roadmap](docs/ROADMAP.md) e [origem da extração](docs/MIGRATION.md)

## Licenciamento

O licenciamento do código está a definir: o pacote está marcado `UNLICENSED` e não foi acrescentada uma concessão de licença aberta nesta publicação. As dependências mantêm seus próprios termos. Veja [NOTICE](NOTICE.md).
