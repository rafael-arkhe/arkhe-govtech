# Rastreabilidade de requisitos

Esta matriz reconcilia a arquitetura-alvo discutida no projeto com o aplicativo independente. “Implementado” significa código presente; evidências de testes estão em [TESTING](TESTING.md). A distribuição não herda garantias dos componentes Rust por compartilhar o nome Arkhe.

| ID | Requisito | Evidência neste app | Estado/limite |
| --- | --- | --- | --- |
| R01 | Negar operação sem autorização | Sessão, papéis e máquina de estados em HTTP/domínio | Implementado no simulador local |
| R02 | Separar proposta de autoridade | Proponente não aprova; revisor não executa | Implementado por conta; não prova duas pessoas físicas |
| R03 | Política e alçada por órgão | Configuração versionada e soma verificada | Implementado; política jurídica é fornecida pelo operador |
| R04 | Mandato e identidade estatal | Conta local e chave Ed25519 | ICP-Brasil, gov.br e poderes externos pendentes |
| R05 | Revisão humana vinculada ao conteúdo | Statement assinado e revisão otimista | Implementado; sem e-CPF |
| R06 | Parada de emergência | Configuração persistente e revalidação | Local; sem propagação distribuída |
| R07 | Persistir estado e evidência atomicamente | Transações SQLite | Implementado para operações do domínio |
| R08 | Histórico verificável | Cadeia SHA-256, snapshot e checkpoint informado | Implementado; não é MMR nem ancoragem externa |
| R09 | Certificado aritmético de soma/limite | Prefixos e inteiros seguros em JS | Implementado; insumos não autenticados |
| R10 | Retenção do certificado | Snapshot JSON persistido | Local; não integra PgWormGraph |
| R11 | Verificação no cliente | Web Crypto e HTML independente | Implementado; sem checker Rust/WASM de PCO |
| R12 | Prevenir duplicatas | Journal único por processo e OperationId | Implementado no simulador; remoto pendente |
| R13 | Despacho mTLS para sistemas públicos | Rótulos de destino simulado | Integração oficial pendente |
| R14 | Login gov.br e principal institucional | Login local | Pendente |
| R15 | Bases oficiais com escopo e proveniência | Digest de fonte declarado | IND/Conecta pendentes |
| R16 | Execução em TEE | Nenhum enclave provisionado | Pendente |
| R17 | Chaves em HSM nacional | Arquivos privados do bootstrap | Pendente |
| R18 | Isolamento entre tenants | Uma organização por instalação | Multi-tenant/RLS não implementados |
| R19 | Não-egresso verificável | Fluxo local sem provedor externo obrigatório | Não certifica infraestrutura/rede completa |
| R20 | Revisão ao titular e explicações | Justificativa, papéis e histórico | Não há portal de direitos ou processo LGPD completo |
| R21 | Retenção e conformidade | Eventos e documentação de limites | Política operacional/regulatória pendente |
| R22 | Perfil interoperável SCITT/WIMSE | Domínios locais explícitos | Pendente; sem alegação de RFC/conformidade |
| R23 | Prova da trajetória de raciocínio | Nenhum LLM/prova de trajetória integrado | Pendente |
| R24 | Assinatura híbrida pós-quântica | Somente Ed25519 | Pendente |
| R25 | Casos públicos com benefício medido | Três modalidades de proposta e demonstração sintética | Sem cliente/piloto institucional comprovado |
| R26 | Pacote para auditor independente | Exportação e verificador | Checkpoint externo e cadastro confiáveis são responsabilidade do auditor |
| R27 | Revalidação em fila/offline | Política e parada antes da execução local | Fila remota, saldo e revogação institucional pendentes |
| R28 | Operação e recuperação | Scripts de backup/restore e runbook | Local; não comprova HA, plantão ou escala |

## Requisitos adicionais de apresentação

- Nove módulos navegáveis com contagens reais da instalação.
- Fila de aprovação, cockpit de execução e dossiê com linha do tempo.
- Plano de piloto persistente/versionado e exportável.
- Confirmações explícitas de execução, mudança de política e emergência.
- Dados e integrações identificados como sintéticos/pendentes.
- Vídeo, roteiro e legendas incluídos no repositório.

## Critério de evolução

Um requisito pendente só deve mudar de estado após existir implementação identificável, teste negativo relevante e evidência operacional correspondente. Um preset, diagrama, texto comercial ou preenchimento de checklist não é suficiente para declarar uma integração concluída.
