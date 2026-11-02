# Histórico

## Não lançado — verificação AFiR de 02/11/2026

- "Verificar pacote" aceita também um OfflineVerificationBundle AFiR v1 (`arkhe-afir-bundle-v1`): recibos ML-DSA-65 e cadeia de checkpoints híbrida ML-DSA-65 + Ed25519, verificados no navegador pelo `arkhe-verify-wasm` vendorizado em `public/govtech/afir/`.
- O glue JS e o binário WASM têm SHA-256 fixado em `public/govtech/afir.mjs` e em `PROVENANCE.json`; o carregamento recusa um artefato divergente antes de instanciá-lo.
- A confiança AFiR (`device` e `receipt_key`) é informada pelo auditor, obtida por canal independente, e a chave de recibo precisa diferir da chave de selagem.
- Testes com subconjunto dos vetores do monorepo (válido, remoção, substituição, checkpoint pulado e recibo forjado) e recusa de artefato alterado.
- O perfil `arkhe-govtech/local-evidence/v1`, o fluxo atual e `offline.html` não mudaram. A página offline ainda não verifica bundles AFiR, e o app não emite recibos AFiR.

## 0.1.0 — 24/10/2026

- Distribuição independente do GovTech, com shell/login, bootstrap e SQLite próprios.
- Nove módulos: visão geral, processos, aprovações, execuções, políticas, evidências, conectividade, plano do piloto e verificação.
- Revisão Ed25519 local, proibição de autoaprovação e revalidação de política antes de efeito.
- Journal sintético transacional, OperationId, exportação e verificador Web Crypto/HTML.
- Dossiê com linha do tempo; modais de execução, política, emergência e plano.
- Seed opcional de dados sintéticos e backup/restore sem sobrescrita da instalação.
- Testes independentes de domínio, autenticação, HTTP, backup e verificação de pacote.
- Receita Docker/Compose, workflow de CI e documentação técnica/operacional.
- Vídeo demonstrativo, roteiro, legendas e imagens.

Limites: uma organização por instalação; sem conectores públicos, validação ICP-Brasil, TEE/HSM, PCO/MMR Rust, prova de trajetória ou assinatura pós-quântica.
