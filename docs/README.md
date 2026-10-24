# Documentação técnica — Arkhe GovTech v0.1.0

Esta documentação descreve a implementação deste repositório. Planos de integração e propriedades desejadas são distinguidos de controles executáveis. Não é uma certificação regulatória ou avaliação independente.

| Documento | Conteúdo | Público principal |
| --- | --- | --- |
| [Instalação](INSTALLATION.md) | Pré-requisitos, contas, variáveis, execução e contêiner | Desenvolvimento e operação |
| [Guia do usuário](USER-GUIDE.md) | Nove módulos, papéis, assinatura e percurso de trabalho | Proponente, revisor e gestor |
| [Arquitetura](ARCHITECTURE.md) | Componentes, fluxos, fronteiras e limites | Engenharia e auditoria |
| [Domínio](DOMAIN.md) | Entidades, máquina de estados, invariantes e permissões | Engenharia e produto |
| [API](API.md) | Rotas, JSON, códigos e exemplos | Integração e testes |
| [OpenAPI](openapi.yaml) | Contrato estruturado de operações e entradas | Integração |
| [Dados](DATA-MODEL.md) | Tabelas, JSON persistido, SQL e concorrência | Engenharia e operação |
| [Criptografia](CRYPTOGRAPHY.md) | Digests, assinaturas, cadeia, pacote e verificador | Auditoria e segurança |
| [Modelo de segurança](SECURITY-MODEL.md) | Ativos, ameaças, confiança e limitações | Segurança e gestão |
| [Operação](OPERATIONS.md) | Saúde, métricas, backup, restauração e incidentes | Operação |
| [Testes](TESTING.md) | Reproduzir verificações e interpretar resultados | Engenharia e revisão |
| [Requisitos](REQUIREMENTS.md) | Rastreabilidade entre intenção, implementação e lacunas | Produto e auditoria |
| [Migração](MIGRATION.md) | O que foi extraído, adaptado e excluído | Manutenção |
| [Roadmap](ROADMAP.md) | Etapas para um piloto e integrações reais | Produto e gestão |
| [ADR 001](adr/001-standalone.md) | Por que uma distribuição independente | Engenharia |
| [ADR 002](adr/002-local-evidence.md) | Por que um perfil local distinto do kernel Rust | Engenharia e auditoria |
| [ADR 003](adr/003-single-organization.md) | Isolamento por instalação e limites dos órgãos | Engenharia e operação |

O [README principal](../README.md) apresenta comandos rápidos e demonstração. A [política de relato de vulnerabilidades](../SECURITY.md), o [guia de contribuição](../CONTRIBUTING.md) e o [histórico de mudanças](../CHANGELOG.md) complementam este conjunto.

## Como interpretar os estados

- **Implementado:** código presente e verificável; não implica produção.
- **Validado localmente:** teste ou execução documentados no ambiente informado.
- **Receita fornecida:** configuração entregue, sem presumir que foi executada em todos os ambientes.
- **Pendente:** depende de integração, qualificação ou operação externa.

O piloto declarado pela equipe não se transforma em parceria institucional por preencher o formulário do plano. Um controle marcado como documentado contém uma referência declarada; o sistema não valida automaticamente o conteúdo dessa referência.
