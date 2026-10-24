# Roadmap de qualificação

As etapas abaixo são critérios propostos, não compromissos com datas, clientes ou instituições. Nenhum nome de órgão no app prova uma parceria.

## A. Consolidar o laboratório

- Preservar compatibilidade dos pacotes, statements e domínios de hash.
- Acrescentar paginação e limites operacionais para históricos grandes.
- Definir expiração explícita da autorização para despacho e revisão após revogação de conta/chave.
- Formalizar migrações, rotação de credenciais e ciclo de vida de usuários.
- Medir acessibilidade, tratamento de falhas e uso com tecnologias assistivas.

Aceite: clone limpo reproduz instalação, testes, build, fluxo assinado e recuperação sem dados do autor do repositório.

## B. Validar um problema público delimitado

Entrevistar usuários e responsáveis; registrar processo, insumos, hipótese de benefício, baseline e critérios de sucesso. Definir papéis, dados permitidos e limites de autoridade. Usar o plano do piloto como organização, não como certificação.

Aceite: parceiro e escopo documentados por canais apropriados, evidências autorizadas e indicadores definidos. Não declarar ganhos de produtividade antes da medição.

## C. Qualificar identidade e política

Implementar identidade institucional, verificação de poderes, mandato, revogação/freshness e assinatura adequada ao processo. Mapear uma política executável a uma regra revisada pelo responsável institucional. Não delegar interpretação normativa a um prompt.

Aceite: testes de chave revogada, mandato expirado, papel incorreto, parâmetros trocados e política atualizada negam efeito; revisão independente aprova o perfil.

## D. Qualificar um conector

Escolher um sistema de destino e ambiente de homologação. Especificar mTLS, autenticação, parâmetros, idempotência no destino, consulta por OperationId e estados de resultado incerto. Projetar outbox e reconciliação antes de retries remotos.

Aceite: queda após commit remoto, timeout, repetição concorrente e reinício do worker não criam efeito duplicado; estado incerto é visível e reconciliável. O journal local sozinho não satisfaz esse requisito.

## E. Auditoria e custódia

Definir política de retenção, minimização, contas de auditor, armazenamento protegido e checkpoints externos. Se adotar MMR/PCO Rust, estabelecer um perfil de integração testado, com schema, golden vectors e ferramentas independentes. Não renomear a cadeia SHA-256 como MMR.

Aceite: auditor com material de confiança retido consegue detectar alteração, truncamento e replay; restauração e acesso são exercitados sob responsabilidades definidas.

## F. Infraestrutura e ampliação

Qualificar HSM/TEE se necessários ao modelo de ameaça; não tratá-los como requisito resolvido por documentação. Antes de multi-tenant, definir fronteiras de chave, processo, rede, banco e operação; órgão em um dropdown não cria isolamento.

Perfis SCITT/WIMSE, proveniência padronizada e assinatura pós-quântica exigem versões e verificadores próprios. Publicação de um padrão não implica sua implementação no produto.
