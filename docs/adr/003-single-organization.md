# ADR 003 — Uma organização por instalação

Estado: adotada para v0.1.0.

## Contexto

A interface apresenta órgãos e políticas distintas, mas o SQLite e a cadeia são compartilhados. Apresentá-los como tenants criaria uma garantia inexistente de confidencialidade.

## Decisão

Uma organização por instalação. Órgãos são escopos de fluxo e política. Owner/reviewer têm acesso global explícito; author tem acesso aos próprios processos. Exportação da cadeia é reservada a papéis elevados e pode conter detalhes de outros processos.

## Consequências

O produto é adequado à validação local e à definição de um piloto delimitado. Não pode ser exposto como SaaS multi-instituição sem novo modelo de isolamento e qualificação. Filtrar listas na interface não substitui controles de armazenamento e autoridade.
