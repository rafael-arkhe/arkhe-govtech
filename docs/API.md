# API HTTP v1

Base local: `http://127.0.0.1:3012/api`. O contrato estruturado está em [openapi.yaml](openapi.yaml). Operações retornam JSON, exceto métricas Prometheus.

## Transporte e sessão

- GET para leitura; POST para alterações. Outros métodos retornam 405 quando chegam ao dispatcher. O adaptador Next só exporta GET/POST.
- POST exige `Origin` exatamente igual a `GOVTECH_ORIGIN` e `Content-Type: application/json`.
- Nas rotas que consomem corpo, ele precisa ser objeto JSON, não array/null, e ter no máximo 262.144 bytes. Logout não consome o corpo.
- Sessão em cookie `govtech_session`: HttpOnly, SameSite=Strict, Path=/, Max-Age=28800; Secure sob origem HTTPS.
- Respostas JSON usam `Cache-Control: no-store`.
- Não há CORS para integração entre origens. Clientes CLI também precisam fornecer Origin em escrita.
- O ator é obtido da sessão. Enviar `authorId`, `role`, `status` ou `publicKey` não concede autoridade na criação/revisão.

## Códigos

| Código | Significado típico |
| --- | --- |
| 200 | Leitura ou transição concluída |
| 201 | Rascunho criado |
| 400 | JSON, campo, item, data ou enumeração inválidos |
| 401 | Sessão ausente/expirada/revogada ou login inválido |
| 403 | Origem, papel, independência ou assinatura não autorizados |
| 404 | Recurso não encontrado ou não visível à conta; rota inexistente |
| 405 | Método não aceito |
| 409 | Revisão obsoleta, parada, alçada, desafio ou política divergentes |
| 413 | Corpo HTTP acima de 256 KiB |
| 415 | Tipo de conteúdo diferente de JSON |
| 429 | Limite de tentativas de login |
| 503 | Falha inesperada, armazenamento ou configuração indisponível |

Erro JSON: `{"error":"mensagem legível"}`. Stack, caminhos e stderr não são expostos pelo handler. Não use texto de erro como contrato estável de máquina.

## Rotas

| Método e caminho | Sessão/papel | Entrada/saída |
| --- | --- | --- |
| `GET /health` | Público | Serviço, status e modo sintético |
| `GET /ready` | Público | Disponibilidade básica do SQLite e FK |
| `GET /metrics` | Owner ou bearer configurado | Texto Prometheus, somente processo atual |
| `POST /login` | Público, origem válida | E-mail/senha; usuário público + cookie |
| `GET /me` | Qualquer sessão | Identidade pública da sessão |
| `POST /logout` | Qualquer sessão | Invalida token e expira cookie |
| `GET /govtech` | Qualquer sessão | Estado filtrado por papel, políticas, módulos e contagens |
| `POST /govtech/cases` | Author/owner | Proposta; retorna snapshot de rascunho |
| `POST /govtech/settings` | Owner | Parada ou política, com revisão global |
| `POST /govtech/pilot` | Owner | Plano completo, com revisão otimista |
| `GET /govtech/cases/{id}/challenge` | Reviewer/owner independente | Statement atual e certificado aritmético |
| `POST /govtech/cases/{id}/action` | Conforme ação | Revisão atual, ação e campos complementares |
| `GET /govtech/cases/{id}/export` | Reviewer/owner | Pacote completo com cadeia compartilhada |

Não existe endpoint individual GET do processo: o cliente o seleciona no estado retornado por `/govtech`. Para grandes coleções, será necessário introduzir paginação e consulta específica em uma versão futura.

## Login

```json
{"email":"author@arkhe.local","password":"senha gerada na sua instalação"}
```

O objeto de usuário contém `id`, `name`, `email`, `role` e `publicKey`; nunca senha, salt, hash ou chave privada. Uma sessão expirada exige login novamente; não há refresh token.

## Criação de processo

```json
{
  "agency":"inovacao",
  "kind":"despesa",
  "title":"Demonstração de conferência de itens",
  "reference":"DEMO-001",
  "body":"DADOS SINTÉTICOS. Solicitação de teste sem efeito público.",
  "sourceDigest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "items":[{"label":"Item sintético A","amount":20000},{"label":"Item sintético B","amount":30000}]
}
```

Valores são **centavos**, não números decimais. O digest ilustrativo é aceito como declaração, não como fonte autenticada. O servidor gera UUID, autor, data, revisão 1, digest e estado `draft`. O endpoint não aceita conteúdo binário ou multipart.

## Transições

Todas usam `POST /govtech/cases/{id}/action`:

| `action` | Campos adicionais | Pré-condições |
| --- | --- | --- |
| `submit` | nenhum | Autor do rascunho; política e soma válidas |
| `approve` | `statement`, `signature` | Revisor/owner diferente do autor; estado review; assinatura e vínculos atuais |
| `reject` | `reason` (5–1000 caracteres) | Revisor/owner diferente do autor; estado review |
| `execute` | nenhum | Owner; autorizado e configuração correspondente |
| `resubmit` | nenhum | Autor de um processo authorized; política atual válida |

Exemplo de submissão:

```json
{"action":"submit","revision":1}
```

O challenge é obtido por GET. O cliente assina os bytes UTF-8 de `statement`, sem converter esse texto para outro JSON. A aprovação envia:

```json
{"action":"approve","revision":2,"statement":"STRING EXATA DO CHALLENGE","signature":"BASE64 DA ASSINATURA ED25519"}
```

`revision` é obrigatório para todas as ações. Uma gravação bem-sucedida incrementa a revisão. Repetir execute com a revisão atual de um caso já executado devolve seu recibo sem novo efeito; repetir uma requisição antiga pode retornar 409. Não há retry automático de criação ou protocolo genérico `Idempotency-Key`.

## Políticas e parada

```json
{"action":"policy","revision":1,"agency":"inovacao","limit":10000000,"humanAbove":500000}
```

```json
{"action":"stop","revision":2,"stopped":true}
```

O resultado é a nova configuração completa. As duas operações incrementam a revisão global; uma versão antiga recebe 409. `humanAbove` não remove a revisão humana obrigatória.

## Plano de piloto

POST do documento completo, com `revision`, `owner`, `targetDate`, `notes`, `controls`. `targetDate` pode ser vazia ou uma data civil válida `YYYY-MM-DD`.

```json
{
  "revision":1,
  "owner":"Equipe de demonstração",
  "targetDate":"",
  "notes":"Planejamento sintético, sem parceria institucional declarada.",
  "controls":[
    {"id":"problem","state":"progress","evidence":"Hipótese a validar com o órgão parceiro."},
    {"id":"identity","state":"pending","evidence":""},
    {"id":"connector","state":"pending","evidence":""},
    {"id":"data","state":"pending","evidence":""},
    {"id":"recovery","state":"pending","evidence":""}
  ]
}
```

Cada ID deve aparecer exatamente uma vez. `documented` exige referência de pelo menos 15 caracteres após trim. Owner até 160 caracteres; notes até 4000; evidence até 1500 por controle. A resposta inclui versão incrementada, data e ator. Reviewer pode ler esse plano em `/govtech`, mas não atualizá-lo; author recebe `pilot:null`.

## Exportação e verificador

A exportação inclui `Content-Disposition` com nome de arquivo. O backend não disponibiliza uma rota de upload/verificação de pacote: essa atividade é feita no navegador por Web Crypto. O pacote contém toda a cadeia, não apenas os eventos do caso. Consulte [criptografia](CRYPTOGRAPHY.md) antes de implementar outro consumidor.

## Compatibilidade e versionamento

Os identificadores de domínio e formato possuem versão explícita. A API de transporte ainda não possui prefixo `/v1`; alterações incompatíveis precisam de uma decisão registrada e testes de compatibilidade. Campos adicionais de entrada geralmente são ignorados, não rejeitados. Não deduza aceitação de uma capacidade porque um campo extra foi recebido sem erro.
