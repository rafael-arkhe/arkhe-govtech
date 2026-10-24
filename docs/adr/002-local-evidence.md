# ADR 002 — Perfil explícito de evidência local

Estado: adotada para v0.1.0.

## Contexto

O kernel possui outros perfis criptográficos. O app precisa registrar revisões e efeitos sintéticos sem anunciar que utiliza PCO Rust, MMR, ICP-Brasil ou ancoragem externa.

## Decisão

Usar `arkhe-govtech/local-evidence/v1`, cadeia JSON/SHA-256, snapshots vinculados e revisão Ed25519. A verificação cliente exige checkpoint fornecido pelo auditor. Formatos e domínios são documentados, e a UI declara o alcance local.

## Consequências

O fluxo é inspecionável com Node/Web Crypto e não exige dependência Rust. O protocolo depende da serialização definida pelo código; mudanças precisam de versionamento. Não há confidencialidade do pacote, prova de completude externa, autoridade temporal ou isolamento contra administrador do host.
