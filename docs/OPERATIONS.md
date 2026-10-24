# Operação, recuperação e incidentes

## Perfil operacional

Instalação local, uma organização, SQLite e filesystem privado. Não há alta disponibilidade, SLA, RTO/RPO contratual, reconciliação com sistema público ou serviço gerenciado de chaves. Defina responsáveis antes de um piloto. O aplicativo não envia notificações externas automaticamente.

## Inicialização e parada

`pnpm dev` é desenvolvimento; `pnpm build && pnpm start` é servidor standalone local. Interrompa pelo terminal que o iniciou. O launcher encaminha SIGINT/SIGTERM ao processo filho. Não presuma drain de requisições, coordenação de leases ou failover distribuído.

Na interface, a parada de emergência é uma configuração de negócio persistente. Ela bloqueia autorizações/efeitos novos, mas não desliga o HTTP nem apaga o histórico. Responder 200 a health não significa que operações estejam liberadas.

## Sondas e métricas

| Sinal | Significado real |
| --- | --- |
| `/api/health` | Processo HTTP responde e declara modo sintético |
| `/api/ready` | SQLite abre e responde; FK está ativa |
| Estado da cadeia em `/api/govtech` | Recomputação da cadeia local, sob confiança no host |
| `/api/metrics` | Contadores/histogramas de requisição e recursos deste processo |

Readiness não valida contas, HSM, conectores, backup, espaço livre ou política de um órgão. Monitore esses aspectos separadamente. Métricas reiniciam com o processo e não são um sistema de armazenamento histórico.

Logs JSON contêm timestamp, método, rota limitada, status, duração e identificador de observação. Esse identificador não é o OperationId do journal. Não há payload, senha, assinatura ou chave privada no logger HTTP. Capture stdout/stderr sob acesso restrito; mensagens de runtime e sistema operacional ainda podem conter caminhos operacionais.

## Backup consistente

O comando usa a API nativa de backup SQLite para incluir transações já confirmadas em WAL sem copiar o arquivo ativo de maneira inconsistente:

```sh
pnpm backup /caminho/privado/backup-govtech-001
```

No Windows, use um destino absoluto como `D:\backups-privados\govtech-001`. O destino precisa ser novo e ficar fora do diretório ativo de dados. O comando copia banco, contas, credenciais iniciais, trust e chaves privadas existentes, produzindo um manifesto SHA-256.

**Esse backup contém segredos.** Armazene-o fora do repositório e do servidor web, com permissões restritas, criptografia e política de retenção adequadas. O manifesto detecta divergência contra seus valores, mas não é assinado: retenha-o por canal confiável. O script não configura criptografia ou armazenamento off-host.

Evite alterar manualmente arquivos de contas enquanto faz backup. O snapshot do banco é consistente; a cópia dos arquivos externos não é uma transação distribuída com alterações administrativas concorrentes.

## Restauração sem sobrescrever a instalação

```sh
pnpm restore /caminho/privado/backup-govtech-001 /caminho/privado/govtech-restaurado
```

O destino precisa ser inexistente. O script valida formato, nomes permitidos, ausência de links simbólicos, digests e presença de banco/contas. Em seguida copia, verifica `PRAGMA integrity_check` e a cadeia local, e remove sessões e tentativas de login antigas. Contas e assinaturas históricas são preservadas. Os hashes do banco restaurado mudam após a limpeza de sessões, sem alterar os eventos GovTech.

Depois configure `GOVTECH_DATA_DIR` para esse novo diretório, inicie outra porta e confirme login, casos, recibos e exportação. Compare um checkpoint previamente retido. Só substitua a rota operacional após o responsável conferir o resultado. Um erro após a criação do destino pode deixar uma restauração parcial; o script não a remove e não aceita sobrescrevê-la silenciosamente.

## Incidentes

| Incidente | Resposta inicial | Conferência antes de retomar |
| --- | --- | --- |
| Suspeita de chave comprometida | Parar novos efeitos; restringir acesso à conta/host | Revogar conta, revisar autorizações históricas e definir nova custódia; não há rotação automática |
| Política incorreta | Suspender e publicar versão corrigida | Reavaliar propostas e obter novas revisões |
| Digest/cadeia divergente | Preservar arquivos e checkpoints, não editar eventos | Comparar backup/checkpoint independente e restaurar em outro diretório |
| Banco indisponível/corrompido | Tratar 503 como falha fechada; não presumir conclusão | Verificar disco, permissões, integrity_check e restore ensaiado |
| Timeout no cliente | Recarregar o estado do processo | Conferir status/OperationId antes de repetir; criação não é idempotente |
| Histórico acima de 8 MiB | Não anunciar auditoria offline concluída | Planejar segmentação de pacotes; ainda não implementada |
| Erro de origem | Conferir URL e configuração | Manter validação de Origin; não trocar por wildcard |

## Atualização

1. Retenha backup e checkpoint externo.
2. Leia CHANGELOG e decisões de migração.
3. Instale com lockfile congelado e execute testes/build.
4. Faça restore de laboratório e teste o novo código contra dados antigos.
5. Inicie a versão validada e confira sonda, login, revisão e exportação.

Não apague `.data` como forma de resolver um problema. `node_modules`, `.next` e código são substituíveis; arquivos privados, evidências e checkpoints exigem custódia. O [modelo de segurança](SECURITY-MODEL.md) lista proteções ainda pendentes.
