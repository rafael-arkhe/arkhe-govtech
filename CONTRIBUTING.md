# Contribuir

## Preparação

Use Node 24.x, pnpm 11.25.0 e lockfile congelado. Leia [arquitetura](docs/ARCHITECTURE.md), [domínio](docs/DOMAIN.md) e [modelo criptográfico](docs/CRYPTOGRAPHY.md) antes de alterar autorizações ou formatos.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
pnpm test:http
```

Crie dados e contas em diretórios temporários ou privados; não reutilize material institucional nos testes. `pnpm demo:seed --confirm-synthetic` é um gerador de exemplos, não uma carga de produção.

## Mudanças

- Mantenha o ator derivado da sessão, a independência de revisão e a revisão otimista.
- Não adicione um caminho de execução que contorne política, emergência ou journal.
- Não altere serialização/ordem de campos de perfis versionados sem uma decisão de compatibilidade.
- Regras de domínio ficam no servidor; componentes de UI não concedem autoridade.
- Para um novo conector, defina estado incerto, deduplicação no destino e reconciliação antes de retries.
- Documente limitações e valide um caso negativo material; testes que apenas repetem a implementação não substituem evidência.
- Mantenha labels, foco e modais acessíveis; teste uma tela estreita e mensagens de erro.

## Preparar revisão

Descreva problema, comportamento final, validação realizada e limitações. Atualize documentação/OpenAPI se contratos mudarem. Inclua captura visual quando a mudança afetar UI e não exponha dados reais.

Após `git add`, execute `pnpm check:publication`. Revise o diff manualmente; o scanner é heurístico e não garante ausência universal de segredos. Nunca versione `.data`, contas, senhas iniciais, chaves privadas, arquivos `.env` reais, dumps de banco ou artefatos de autenticação.

O licenciamento do código está a definir. Não acrescente uma licença ou atribuição em nome de terceiros sem autorização.
