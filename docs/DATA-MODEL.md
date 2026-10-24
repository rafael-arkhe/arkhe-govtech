# Banco de dados e concorrência

## Localização

O arquivo é `govtech.sqlite`, no diretório privado definido por `GOVTECH_DATA_DIR` ou `.data` no diretório de execução. O launcher converte o caminho para absoluto antes de iniciar o servidor. Os arquivos de contas e chaves ficam no mesmo diretório, fora de `public/`.

O adaptador cria o schema de autenticação na abertura. O domínio cria as tabelas GovTech de modo aditivo, com `CREATE ... IF NOT EXISTS`. Não existe um framework numerado de migrações nesta versão; alterações de schema futuras precisam de procedimento explícito e teste de atualização.

## Tabelas

| Tabela | Colunas e restrições | Uso |
| --- | --- | --- |
| `sessions` | `hash TEXT PRIMARY KEY`, `user_id TEXT`, `expires INTEGER` | Sessões: hash SHA-256 do token; expiração em milissegundos |
| `login_attempts` | `subject TEXT PRIMARY KEY`, `count INTEGER`, `until_ms INTEGER` | Limitação de tentativas por e-mail normalizado e hasheado |
| `gov_config` | `id INTEGER PRIMARY KEY CHECK(id=1)`, `value TEXT` | Documento JSON da configuração e políticas |
| `gov_pilot` | `id INTEGER PRIMARY KEY CHECK(id=1)`, `value TEXT` | Plano de piloto versionado |
| `gov_cases` | `id TEXT PRIMARY KEY`, `value TEXT` | Snapshot JSON de cada processo |
| `gov_journal` | `operation_id TEXT PRIMARY KEY`, `case_id TEXT UNIQUE REFERENCES gov_cases(id)`, `value TEXT` | Recibo sintético, único por processo |
| `gov_events` | `seq INTEGER PRIMARY KEY AUTOINCREMENT`, `case_id TEXT`, `payload TEXT`, `previous TEXT`, `hash TEXT` | Cadeia global de eventos |

Colunas são `NOT NULL` onde especificado no código. `case_id` dos eventos não possui chave estrangeira: eventos de configuração/plano utilizam string vazia. Não há tabela de contas: o bootstrap é armazenado em `accounts.json`.

Índices de autenticação facilitam a limpeza por expiração. A consulta de processos usa a ordem de inserção inversa. O domínio lê o JSON e aplica a política de visibilidade; não há RLS ou isolamento SQL por órgão.

## Estrutura de processo

```json
{
  "id": "UUID gerado pelo host",
  "agency": "inovacao",
  "kind": "despesa",
  "title": "Demonstração sintética",
  "reference": "DEMO-001",
  "body": "Contexto e justificativa declarados",
  "sourceDigest": "SHA-256 hexadecimal de 64 caracteres",
  "items": [{"label": "Item sintético", "amount": 480000}],
  "authorId": "author",
  "createdAt": "ISO-8601 UTC",
  "revision": 1,
  "status": "draft",
  "digest": "compromisso da proposta",
  "review": null,
  "receipt": null
}
```

`proof`, `review`, `receipt` e `rejection` são acrescentados conforme as transições. JSONs ilustrativos deste documento usam descrições no lugar de hashes reais e não devem ser enviados como fixtures válidas.

## Transações

`transaction(fn)` adquire `BEGIN IMMEDIATE`. Em contenção, repete somente a aquisição, até duas vezes após a primeira tentativa, com pequeno backoff e jitter. O timeout SQLite é de 5 segundos por aquisição. Não se deve interpretar esse valor como timeout global do endpoint.

O callback não pode retornar Promise. Sucesso executa COMMIT; erro executa ROLLBACK. Como as regras e persistência são síncronas, a revisão atual é lida e comparada dentro da mesma transação que grava a atualização.

| Operação | Escritas atômicas |
| --- | --- |
| Criação | Snapshot de rascunho + evento `created` |
| Submissão/revisão/rejeição | Novo snapshot + evento da ação |
| Configuração | Documento de configuração + evento global |
| Plano | Documento do plano + evento global |
| Execução | Journal + snapshot com recibo + evento `execute` |

## Imutabilidade e reconstrução

Triggers bloqueiam UPDATE e DELETE em `gov_events`. Processos são snapshots mutáveis conforme a máquina de estados; o journal tem unicidade, mas não possui as mesmas triggers append-only. A proteção não resiste a administrador que possa alterar o schema, copiar ou substituir o arquivo.

O aplicativo não implementa reconstrução completa de todos os snapshots a partir dos eventos. A exportação permite conferir o snapshot atual de um processo contra seu último evento. Não confundir essa verificação com event sourcing integral ou arquivo WORM certificado.

## Idempotência

O OperationId é determinístico para caso e proposta. `gov_journal` impede segundo recibo por processo. Um replay de `execute` com a **revisão atual** devolve o snapshot executado sem inserir novo journal ou evento.

Repetir a mesma requisição antiga pode retornar 409 por revisão obsoleta; o cliente deve recarregar o processo. Não há suporte genérico ao header `Idempotency-Key`, e repetir `POST /govtech/cases` cria novos rascunhos. Não habilitar retries indiscriminados de criação.

## Evolução e backup

Antes de modificar tabelas ou formatos JSON, retenha uma cópia consistente e teste abertura, exportação e verificação de pacotes antigos. Preserve os domínios de hash e a ordem dos campos de projeções versionadas. O [runbook](OPERATIONS.md) cobre backup/restore, WAL e verificação de integridade.
