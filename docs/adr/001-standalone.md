# ADR 001 — Distribuição independente

Estado: adotada para v0.1.0.

## Contexto

O GovTech foi implementado dentro do Intra. Publicar apenas seus componentes deixaria imports de auth, store, caminhos e WASM apontando para um workspace indisponível ao usuário que clonasse o novo repositório.

## Decisão

Manter os componentes e domínio GovTech e fornecer shell, autenticação de bootstrap, store, launcher e build próprios. Eliminar dependência de crates, serviços e arquivos privados do workspace original. Validar por testes e servidor standalone com diretório vazio.

## Consequências

Clone e operação local ficam reproduzíveis. Funções do Intra que não pertencem ao GovTech não são levadas implicitamente. Há uma linha de manutenção independente; correções comuns precisam de sincronização consciente. Migração de dados exige procedimento específico.
