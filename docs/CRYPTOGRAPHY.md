# Protocolo criptográfico e verificação

## Escopo

Este perfil é `arkhe-govtech/local-evidence/v1`. Ele usa SHA-256, JSON com projeções de campos definidas pelo código e Ed25519. Não é o CBOR canônico, BLAKE3, MMR, PCO Rust, OVERT, C2PA ou um receipt SCITT do kernel Arkhe.

O verificador confirma integridade e vínculos sob um checkpoint confiável. Não prova legalidade, completude dos insumos, identidade civil, poderes de representação, residência de dados ou execução em hardware atestado.

## Compromisso de proposta

O digest é SHA-256 dos bytes UTF-8 de `JSON.stringify` da projeção, nesta ordem:

```text
domain = "arkhe-govtech/proposal/v1"
id, agency, kind, title, reference, body,
items, sourceDigest, authorId
```

Cada item é projetado como `label, amount` pelo criador. Campos textuais de entrada são aparados; não há normalização Unicode adicional. Não reordenar campos ou trocar serializadores silenciosamente. Uma mudança de protocolo exige versionamento e vetores de compatibilidade.

O `sourceDigest` é declarado pelo usuário. Calculá-lo no navegador vincula os bytes selecionados, mas não garante procedência ou autenticidade. A fonte original deve ser retida por quem a custodia.

## Predicado aritmético local

`proof` contém domínio `arkhe-govtech/budget-check/v1`, identificador `sha256`, digest/revisão de política, digest de proposta, total, limite, revisão humana obrigatória e totais prefixados.

Para itens não negativos, o verificador confere `prefixTotals[0]=0`, cada soma sucessiva, resultado inteiro seguro e `total <= limit`. O domínio é finito, limitado a 256 itens; o custo de conferência é linear no número de itens. Unidades são centavos inteiros.

O campo tem função de certificado aritmético transparente em JavaScript. Não é prova de saldo contábil real, de custos verdadeiros ou de correspondência com um empenho no Estado. O digest da política é SHA-256 do JSON da política aplicada, enquanto a revisão global captura alterações e emergência.

## Revisão assinada

O desafio do servidor é uma string JSON, assinada **sem reserialização**. Campos:

| Campo | Vínculo |
| --- | --- |
| `domain` | `arkhe-govtech/review/v1` |
| `caseId` | Processo revisado |
| `revision` | Revisão do processo no momento do desafio |
| `proposalDigest` | Conteúdo da proposta |
| `policyDigest`, `policyRevision` | Política e versão da configuração |
| `reviewer` | Identidade autenticada do revisor |
| `verdict` | `approve` |
| `expires` | Prazo de aceitação do desafio, em milissegundos |

O prazo é de cinco minutos. O servidor aceita apenas o mesmo caso, revisão, conteúdo, política e revisor, com expiração futura de no máximo cinco minutos em relação ao relógio atual. O desafio não precisa ser persistido: a assinatura e os vínculos são verificados na aprovação, e a mudança de revisão impede reutilizá-lo no mesmo estado.

Assinatura: Ed25519, 64 bytes codificados em base64. Chave privada de arquivo PEM PKCS#8, importada pelo Web Crypto no navegador. Chave pública em PEM SPKI, obtida da conta autenticada. O servidor não aceita do cliente uma chave pública substituta para conceder aprovação.

A expiração limita a aceitação do desafio; não define uma expiração autônoma de autorização já registrada. Uma autorização antiga pode continuar despachável se a configuração não mudar. Esse é um limite importante para qualificação futura.

## Eventos e snapshot

Para cada evento:

```text
previous = hash do evento anterior, ou 64 zeros no início
payload = JSON string com domínio, data, ator, ação, caso e detalhes
caseDigest = SHA256(JSON.stringify(snapshot completo do processo))
hash = SHA256(UTF8(previous + "\n" + payload))
```

Eventos globais de configuração/plano não vinculam um processo e têm `caseDigest:null`. `seq` é gerado pelo banco e precisa formar um prefixo contíguo a partir de 1 na exportação.

O verificador encontra o último evento do caso e compara seu `caseDigest` com o snapshot exportado. Isso impede trocar campos do comprovante, da revisão ou do certificado sem também alterar a cadeia contra o checkpoint original.

## OperationId

```text
SHA256(UTF8("arkhe-govtech/operation/v1\n" + caseId + "\n" + proposalDigest))
```

É uma identidade do efeito simulado neste perfil. Unicidade local não produz exactly-once em um sistema externo. A data do recibo vem do relógio do host, sem autoridade temporal independente.

## Pacote exportado

Campos de topo: `format`, `exportedAt`, `case`, `policy`, `events`, `checkpoint`, `externalAnchor:false` e aviso de escopo. `policy` é a configuração atual exportada, que pode ser diferente da histórica; a assinatura e o snapshot retêm seus vínculos próprios. Não interpretar esse campo como uma prova automática da norma vigente em uma data.

O pacote contém a cadeia compartilhada da instalação e pode incluir detalhes de outros processos. Por isso, somente reviewer/owner exportam; o operador precisa controlar destinatários e minimização. O programa não possui redação seletiva ou prova de divulgação mínima.

## Algoritmo do verificador

1. Conferir o identificador do formato, limite de eventos e checkpoint hexadecimal fornecido.
2. Recomputar os eventos, incluindo sequência contígua, anterior e hash de payload.
3. Exigir igualdade entre raiz calculada, raiz do pacote e checkpoint externo informado.
4. Recalcular a proposta, localizar sua criação e conferir o snapshot contra o último evento do caso.
5. Conferir os passos aritméticos e os vínculos de política/proposta.
6. Quando houver revisão, conferir sua igualdade com a evidência do evento, a assinatura e os vínculos do statement.
7. Para autorizado/executado, exigir revisão. Para executado, exigir recibo correspondente com `externalEffect:false`.

O navegador limita o arquivo a 8 MiB; o módulo aceita até 100.000 eventos. O servidor não limita a exportação a 8 MiB: históricos grandes exigirão paginação/pacotes segmentados, ainda não implementados.

## Checkpoint e confiança

Se pacote e raiz vierem exclusivamente do mesmo operador, ele pode fabricar outro histórico coerente. O auditor deve reter a raiz por canal independente antes de verificar. A chave pública incluída no pacote só ganha significado na medida em que está vinculada ao histórico e a um cadastro/checkpoint confiáveis.

Não há TSA, HSM, prova de consistência entre checkpoints, detecção distribuída de forks ou ancoragem pública. A demonstração positiva usa um pacote sintético e sua raiz para mostrar o mecanismo; isso não é uma atestação independente. Os testes negativos retêm a raiz original e rejeitam alterações.
