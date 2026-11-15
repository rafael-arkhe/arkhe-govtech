# Qualificação GovTech para SIAFIC municipal

Pesquisa e proposta de engenharia em 27/10/2026. Escopo: distribuição independente Arkhe GovTech. Os requisitos abaixo são propostos; não alteram o estado de implementação registrado em [REQUIREMENTS](REQUIREMENTS.md).

## Decisão de produto

Priorizar a preparação e revisão de dossiês de despesa, com consulta ao sistema contábil em homologação, antes de habilitar escrita. O responsável público conserva a decisão e o SIAFIC conserva o registro contábil autoritativo. A hipótese de benefício é reduzir retrabalho e tempo de conferência; exige medição em piloto.

O MVP já oferece proposta, revisão assinada, política versionada, execução simulada e evidência verificável. O próximo incremento deve provar a qualidade dos insumos, o vínculo de competência e a segurança do conector. Acrescentar nomes de órgãos ou um certificado de soma não resolve esses pontos.

## Fontes e limites do benchmark

| Fonte primária consultada | Fundamento | Consequência de engenharia proposta |
| --- | --- | --- |
| [Decreto 10.540/2020, texto consolidado](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/decreto/d10540.htm), arts. 1º e 11 | Sistema compartilhado com autonomia; identificação e habilitação dos usuários | Separar ente, poder, órgão e unidade gestora; verificar competência além de autenticar |
| [Tesouro: SIAFIC — Perguntas e Respostas](https://siconfi.tesouro.gov.br/siconfi/pages/public/conteudo/conteudo.jsf?id=39304) | Base compartilhada e integração com sistemas estruturantes | Integrar ao SIAFIC existente com contrato e responsabilidades definidos |
| [Lei 4.320/1964](https://planalto.gov.br/ccivil_03/leis/l4320compilado.htm), arts. 58–64 | Etapas da despesa e comprovação do crédito | Regras distintas para empenho, liquidação e pagamento |
| [ANPD: direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares) | Revisão e informação sobre decisões automatizadas nas hipóteses aplicáveis | Canal de contestação, responsável e explicação compreensível |
| [Governo Digital: ePING](https://www.gov.br/governodigital/pt-br/infraestrutura-nacional-de-dados/interoperabilidade/padroes-de-interoperabilidade) | Padrões de interoperabilidade; adoção facultativa pelos demais entes federativos | Definir perfil por integração, sem presumir obrigação municipal de X-Road |
| [Prefeitura de Rio Paranaíba: pregões eletrônicos](https://rioparanaiba.mg.gov.br/pregao-eletronico/) | Canal oficial consultado | O inteiro teor do PE 034/2026 não foi localizado nessa consulta |

O texto fornecido menciona quatro entidades, SLA P1 de 1h/4h, PoC em três dias úteis e aprovação de 80%/100%. Essas condições permanecem **não verificadas em fonte primária**. Não devem virar obrigação contratual, requisito eliminatório ou alegação comercial. Para admitir o edital como benchmark, arquivar edital, anexos e retificações oficiais, URL, data de obtenção, hash SHA-256 e item/página de cada extração. Uma referência em agregador não substitui essa evidência.

As consequências da tabela são decisões de projeto, não transcrições de exigências legais de implementação. A revisão institucional deverá estabelecer a aplicabilidade ao processo concreto.

## Correções incorporadas à arquitetura proposta

1. **Saldo não é liquidação.** Soma e alçada conferem aritmética local. Empenhar exige crédito disponível; liquidar exige verificar direito do credor e documentação; pagar exige liquidação regular e ordem competente. Cada etapa requer insumos próprios, atualizados e autenticados.
2. **Chave não prova poder.** Ed25519 ou `did:key` não comprovam identidade gov.br, CPF habilitado, vínculo funcional ou delegação. O principal técnico do agente deve ser distinto do responsável e do aprovador, com mandato, escopo, prazo e revogação verificáveis.
3. **Journal não garante efeito único remoto.** A atomicidade SQLite vale para o simulador. Após timeout remoto, consultar o destino e reconciliar; não repetir uma escrita sem evidência de segurança.
4. **Recibo não certifica LGPD.** A cadeia permite verificar integridade sob hipóteses de confiança. Não prova veracidade do documento, adequação da decisão, retenção legal ou atendimento ao titular. Não há homologação pelo TCE-MG demonstrada.
5. **Verificação não reproduz cognição.** O verificador atual confere o pacote local; não executa PCO Rust/WASM, não verifica MMR e não reconstitui o raciocínio de um LLM.

## Contrato proposto para o SIAFIC-Agent Guard

Componente futuro, sem rota de execução pública habilitada por este documento.

| Grupo | Campos mínimos propostos |
| --- | --- |
| Escopo | `organizationId`, `entityId`, `powerId`, `agencyId`, `managementUnitId`, exercício |
| Ação | etapa explícita (`empenho`, `liquidacao`, `pagamento`), referência do processo, beneficiário, valores em centavos inteiros e moeda |
| Evidência | identificadores e digests dos documentos, origem autenticada, instante da consulta, versão do registro contábil, validade máxima configurada |
| Autoridade | principal técnico, responsável, aprovador, mandato, escopo de competência, versão da política e validade da autorização |
| Execução | `operationId`, digest canônico do comando, destino e versão do conector, estado remoto e identificador retornado |

Campos não podem ser aceitos como verdade apenas por constarem no JSON enviado pelo agente. O servidor resolve o escopo pela sessão e pelo cadastro autorizado, valida relações e obtém evidências pelo conector. Escopo negado deve bloquear consulta, exportação e execução, inclusive por acesso direto ao identificador.

### Regras por etapa

- Empenho: conferir exercício, classificação, fonte/destinação e unidade; usar disponibilidade autoritativa. Evitar corrida por reserva ou precondição de versão atômica oferecida pelo destino. Duas leituras de saldo iguais não constituem reserva.
- Liquidação: vincular empenho válido, credor e documento fiscal; controlar liquidações parciais, estornos e saldo a liquidar; exigir ateste e documentos comprobatórios revisados pelo responsável.
- Pagamento: vincular liquidação, ordem competente e favorecido; verificar limites e disponibilidade pertinentes no destino. Alteração de dados bancários requer revisão específica. Não tratar saldo de dotação como saldo de caixa.
- Todas: rejeitar dado ausente, vencido, negativo, fracionário em centavos, soma fora do intervalo seguro, escopo divergente ou política/mandato revogado. Mudança de conteúdo exige nova aprovação.

### Protocolo de execução remota

Persistir comando autorizado e outbox na mesma transação local. Antes do envio, revalidar mandato, parada, política e precondições do destino. Vincular `operationId` ao escopo, ação e digest; a mesma chave com payload diferente deve gerar conflito.

Estados propostos: `prepared → dispatching → confirmed | rejected | unknown`. Timeout após envio leva a `unknown`, bloqueia nova operação equivalente e abre reconciliação por identificador externo. Registrar cada tentativa e evidência de consulta. Só reenviar quando o contrato do destino assegurar idempotência ou comprovar ausência de efeito com garantias suficientes. Sem essa capacidade, a escrita automática permanece desabilitada. Cancelamento contábil é operação compensatória autorizada, não exclusão de histórico.

## Backlog priorizado e aceite

Todos os itens estão propostos, não implementados.

| ID | Prioridade | Entrega | Evidência de aceite exigida |
| --- | --- | --- | --- |
| SG01 | P0 | Captura oficial do benchmark | Arquivos, hashes, retificações e extrações por item/página; SLA/PoC só após confirmação |
| SG02 | P0 | Consulta contábil em homologação | Fixtures sintéticas e contrato do fornecedor; origem, escopo, versão e validade verificáveis |
| SG03 | P0 | Modelo das três etapas | Rejeitar liquidação sem empenho/ateste, pagamento sem liquidação e divergência de credor |
| SG04 | P0 | Concorrência e disponibilidade | Dois comandos que excedem conjuntamente o saldo não podem ambos produzir efeito |
| SG05 | P0 | Mandato e segregação por escopo | Revogação antes do despacho, acesso direto e exportação cruzada negados |
| SG06 | P0 | Outbox e reconciliação | Timeout após commit remoto, reinício e retries concorrentes preservam um efeito; payload divergente conflita |
| SG07 | P1 | Dossiê minimizado e custódia | Verificação com checkpoint externo; restaurar backup e detectar alteração/truncamento; controlar acesso aos anexos |
| SG08 | P1 | Revisão e explicação ao titular | Exercitar solicitação, atribuição ao responsável, resposta e registro de contestação quando aplicável |
| SG09 | P1 | Operação e incidentes | Exercitar indisponibilidade do destino, parada, recuperação e fila `unknown`; medir tempos sem prometer SLA não validado |

## Piloto e métricas

Começar com dados sintéticos e leitura em homologação; depois, modo sombra autorizado, em que o servidor compara propostas com decisões dos responsáveis sem produzir atos. Escrita só após aceite de SG02–SG06, contrato do destino, responsável institucional e ensaio de recuperação.

Medir tempo mediano e p95 de conferência, retrabalho por dossiê, divergências detectadas confirmadas pelo revisor, bloqueios indevidos, percentual de evidências completas e duração de estados incertos. Registrar tamanho da amostra, baseline, período e critérios de comparação. Não publicar economia ou acurácia antes dessa medição.

O relatório de PoC deve listar cada requisito com `aprovado`, `reprovado` ou `não executado`, cenário, evidência e limitação. Aprovação dos testes do guard não substitui avaliação funcional de um GRP completo nem comprova conformidade jurídica integral.
