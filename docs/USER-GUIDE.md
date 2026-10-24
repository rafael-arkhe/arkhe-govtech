# Guia de uso

## Papéis e acesso

O aplicativo usa contas de autoria, revisão e governança geradas na configuração local. Uma pessoa não adquire papel de governança por escolher um órgão ou editar uma proposta. A [matriz de permissões](DOMAIN.md) é aplicada pelo servidor.

O shell mostra nome e papel da sessão, além de logout. A navegação contém nove módulos. Em telas estreitas, o menu e as tabelas usam rolagem horizontal local. A interface tem labels, foco visível, mensagens de erro e modais nativos com comportamento de diálogo; isso não representa auditoria WCAG completa.

## 1. Visão geral

As contagens são derivadas dos dados que a conta pode ler. O volume e os eventos não são métricas de produção pública. Os seis estágios ajudam a explicar a separação entre propor e autorizar; o rótulo do ciclo não significa que o kernel Rust está integrado.

## 2. Criar e enviar processo

1. Abra Processos → Novo processo.
2. Informe título, referência, órgão, modalidade e justificativa.
3. Acrescente os itens. Use valores com até duas casas decimais; processos sem despesa podem usar zero.
4. Selecione a fonte para calcular o SHA-256 no navegador, ou informe o digest de uma fonte já retida.
5. Registre o rascunho e confira o detalhe.
6. Envie para revisão. O servidor rejeita soma acima da política, digest divergente ou parada ativa.

O arquivo selecionado não é enviado. Guarde o original em local autorizado. A versão atual não edita ou exclui rascunhos já registrados; confira os dados antes de salvar. Referências administrativas não são únicas no banco.

## 3. Aprovações

O revisor usa a fila para encontrar propostas em revisão. Ao abrir o detalhe, deve conferir contexto, valores e fonte por seus próprios procedimentos. O app não substitui julgamento administrativo.

**Aprovar:** abra Revisar e assinar e selecione a chave da própria conta. O navegador solicita um desafio atual e assina os bytes correspondentes. Uma chave de outra conta, um desafio expirado ou uma política alterada são recusados. Nenhuma chave privada é transmitida pelo fluxo.

**Rejeitar:** informe um motivo de pelo menos cinco caracteres e confirme a ação do formulário. A rejeição é registrada sob a sessão do revisor, mas não possui a mesma assinatura exigida para aprovação. O autor pode cadastrar uma nova proposta, mantendo referência ao processo rejeitado.

Quem propôs, inclusive owner, não pode aprovar ou rejeitar a própria proposta. A conta revisora não executa operações nem modifica políticas.

## 4. Executar e inspecionar

O owner abre o processo autorizado e escolhe Executar no simulador. O modal apresenta referência e total; a confirmação solicita revalidação no servidor. Um recibo concluído declara `externalEffect:false`.

O cockpit de Execuções permite abrir o processo ou inspecionar o recibo. O dossiê exibe digest, política, aritmética, OperationId e linha do tempo. A lista detalhada da interface deriva dos 100 eventos mais recentes da instalação; exportar o pacote permite verificar a cadeia completa, sujeita aos limites de tamanho documentados.

Se a política mudou, o autor do processo autorizado pode Solicitar nova revisão. Isso não altera o conteúdo; remove a revisão anterior do snapshot e reabre o fluxo sob a configuração atual.

## 5. Políticas e emergência

Somente governança pode salvar alçadas. O modal apresenta o limite anterior e o novo. Todo processo continua exigindo revisão humana, mesmo abaixo do limiar de atenção.

Suspender processamento e Retomar processamento exigem confirmação. Ambos alteram a revisão global. Os dados anteriores são preservados; autorizações antigas precisam de nova revisão antes de um novo efeito. A parada não interrompe serviços de outros hosts ou sistemas externos.

## 6. Evidências e verificação

Reviewer/owner podem exportar um pacote pelo detalhe do processo. O pacote contém cadeia compartilhada, portanto pode revelar detalhes de outros processos. Compartilhe somente com destinatário autorizado.

Na tela Verificar pacote, selecione o JSON e informe o checkpoint independente. A confirmação ocorre no navegador. Para uso sem sessão e sem rede, salve `public/govtech/offline.html` como arquivo único e abra-o em navegador compatível. O checkpoint do próprio pacote demonstra consistência interna, mas não fornece confiança independente.

## 7. Conectividade

O painel declara simuladores disponíveis e integrações pendentes. Ele não contém botão para habilitar silenciosamente sistemas públicos. Qualificação de conectores, identidade institucional e infraestrutura é trabalho técnico/operacional separado.

## 8. Plano do piloto

Governança pode editar responsável, data-alvo, observações e cinco controles. Marcar um controle como Documentado exige referência textual de evidência. O aplicativo não visita ou valida essa referência. Reviewers podem consultar o plano, e o export Markdown permite levá-lo para discussão.

Se outra sessão atualizar o plano, uma gravação com revisão antiga retorna 409. Recarregue antes de reaplicar sua alteração. O plano não cria parceria, contrato ou aceite de um órgão público.
