# Arkhe GovTech — demonstração narrada

Montagem com capturas reais do aplicativo, dados sintéticos e narração sintetizada em português.

## 01. Visão geral

Governança verificável para operações públicas

Este é o Arkhe GovTech, um aplicativo para organizar propostas, revisão humana, autorização e evidências de operações públicas. Esta demonstração usa dados sintéticos. O ambiente é local e não envia atos a sistemas do Estado. Vamos percorrer o fluxo completo e os controles disponíveis.

## 02. Processos administrativos

Despesas, licitações e atendimento

A tela de processos reúne propostas de despesas, triagem de licitações e atendimento ao cidadão. A busca e os filtros ajudam a localizar registros por referência, órgão e situação. Cada processo mantém um estado explícito, sem confundir proposta, autorização e execução.

## 03. Nova proposta

Contexto, fonte e valores declarados

O cadastro começa com título, referência administrativa, órgão e modalidade. A justificativa registra o contexto da solicitação. Os itens usam valores em reais, convertidos pelo servidor para centavos inteiros. Um documento pode ter seu resumo criptográfico calculado no navegador, sem envio do arquivo original.

## 04. Proposta registrada

Rascunho persistente, sem autoridade de execução

Após o cadastro, o aplicativo exibe o processo e os compromissos da proposta. O resumo da fonte vincula os bytes declarados, mas não certifica a autenticidade do documento. O rascunho permanece sem autoridade para execução. O autor precisa encaminhá-lo para uma revisão independente.

## 05. Envio para revisão

Soma e política verificadas antes da autorização

Ao enviar para revisão, o servidor confere a proposta e a soma dos itens contra a alçada do órgão. O resultado fica vinculado ao processo e à política. A mesma pessoa que propôs não pode aprovar. Neste perfil, a revisão humana é sempre obrigatória.

## 06. Fila de aprovações

Visibilidade sobre decisões pendentes

A nova fila de aprovações organiza os processos em revisão, autorizados e rejeitados. As informações exibidas vêm do banco local. O revisor consegue identificar a referência, o valor e a etapa de cada proposta, enquanto a separação de funções continua sendo aplicada pelo servidor.

## 07. Revisão assinada

Chave privada usada somente no navegador

Uma segunda conta abre a proposta e revisa seus dados. O modal de aprovação usa a chave Ed25519 local do próprio revisor. A chave privada permanece no navegador; o servidor recebe o desafio assinado e valida seu vínculo com a proposta e a política. Esta assinatura não equivale a e-CPF.

## 08. Autorização registrada

Aprovação vinculada à proposta e à política

Com a assinatura válida, o processo passa para autorizado. A autorização registra quem revisou e qual política foi aplicada. Isso ainda não representa um ato público executado. A governança precisa solicitar a execução, e as condições são verificadas novamente no momento do despacho.

## 09. Confirmação de execução

Efeito limitado ao simulador local

Antes da execução, um modal apresenta o processo e o total proposto. A confirmação deixa claro o alcance da operação. No servidor, a política e a parada de emergência são revalidadas. Somente o simulador local está habilitado; não existe pagamento ou lançamento em sistema público.

## 10. Cockpit de execuções

Journal persistente e recibos por operação

O cockpit consolida operações concluídas, volume sintético e propostas prontas para simular. Cada processo executado recebe um identificador único de operação. O efeito simulado, o journal e o evento são gravados na mesma transação SQLite. Repetir uma execução concluída não cria outro recibo.

## 11. Dossiê da operação

Linha do tempo e vínculos verificáveis

O modal de dossiê reúne o resumo da proposta, a política vinculada, os passos aritméticos e o identificador da operação. A linha do tempo mostra criação, revisão e execução, com ator, data e resumo de cada evento. Isso facilita a inspeção da sequência registrada.

## 12. Políticas e alçadas

Regras versionadas por órgão

A governança administra alçadas por órgão e publica alterações com confirmação explícita. Uma mudança de política invalida autorizações anteriores para despacho e exige nova revisão. O limiar de atenção é informativo: ele não elimina a revisão humana obrigatória neste perfil.

## 13. Parada de emergência

Suspensão local com histórico preservado

O controle de emergência possui um modal que explica o impacto antes da confirmação. Quando ativado, bloqueia novas autorizações e execuções nesta instalação. Os processos e recibos anteriores são preservados. A retomada também altera a versão da configuração, exigindo nova revisão de autorizações antigas.

## 14. Trilha de evidências

Eventos encadeados e exportação auditável

A tela de evidências apresenta eventos encadeados e o journal local. O pacote exportado contém o processo e o histórico necessário para verificar a cadeia. Como a cadeia é compartilhada, a exportação é reservada à revisão e à governança, e deve ser compartilhada somente com auditores autorizados.

## 15. Verificação independente

Integridade, aritmética e assinatura no cliente

O auditor seleciona o pacote no navegador e informa um checkpoint previamente retido por canal independente. O verificador confere o conteúdo, a cadeia, os passos aritméticos e a assinatura vinculada. Também existe uma página independente para uso offline. Esta verificação não certifica poderes jurídicos ou autenticidade dos insumos.

## 16. Conectividade transparente

Capacidades disponíveis e integrações pendentes

O painel de conectividade distingue a execução simulada das integrações futuras. Gov ponto br, ICP-Brasil, sistemas públicos, HSM e ambientes protegidos não são apresentados como integrações concluídas. Essa distinção permite apresentar o que funciona hoje sem antecipar certificações ou capacidades ainda não qualificadas.

## 17. Plano de piloto

Critérios declarados e referências de evidência

A nova tela de plano do piloto organiza cinco frentes: problema público, identidade, conector, dados e recuperação. O plano possui responsável, data-alvo e observações. Cada controle pode estar pendente, em preparação ou documentado. Marcar um controle como documentado exige uma referência de evidência.

## 18. Plano versionado e exportável

Preparação concreta para validação institucional

O modal de edição permite atualizar o plano e registrar uma nova versão no servidor. Revisão e governança podem acompanhar o planejamento, mas somente a governança pode alterá-lo. O plano também pode ser exportado. Esses estados são declarações da equipe e não substituem uma avaliação independente.

## 19. Do MVP ao piloto

Evidência antes da autoridade

O Arkhe GovTech demonstra um ciclo funcional de proposta, revisão assinada, autorização, execução simulada e verificação independente. A aplicação passou por build de produção e testes automatizados. O próximo passo é validar um processo delimitado com um órgão parceiro e qualificar as integrações necessárias para efeitos reais.