# Instalação e configuração

## Ambiente suportado

- Node.js **24.x**, incluindo o módulo `node:sqlite`.
- pnpm **11.25.0**, conforme `packageManager`.
- Windows ou Linux para execução Node. O build inclui um adaptador de links para o tracing standalone no Windows.
- Navegador com Web Crypto e Ed25519. Use localhost ou HTTPS para assinatura; HTTP remoto pode não oferecer contexto seguro.

As versões das dependências diretas e o lockfile foram preservados de forma explícita. Não há requisito de Rust, Python, PostgreSQL, IA remota ou WASM do monorepo para executar o app.

## Primeiro uso

```sh
pnpm install --frozen-lockfile
pnpm run setup
pnpm dev
```

Use `pnpm run setup`, com `run`, para não confundir com o comando próprio de configuração do gerenciador pnpm.

O setup gera `accounts.json`, `credentials.json`, `trust.json` e três arquivos `*.private.pem` no diretório privado. Cada conta recebe senha aleatória e par Ed25519. A senha é armazenada como hash scrypt em `accounts.json`; `credentials.json` contém os dados iniciais de acesso em texto, portanto exige proteção equivalente à de uma chave. Não há envio por e-mail.

As contas iniciais são `author@arkhe.local`, `reviewer@arkhe.local` e `owner@arkhe.local`. Senhas nunca são fixas ou publicadas no README. Os nomes exibidos são fictícios de demonstração.

Executar novamente preserva arquivos existentes. O setup não é uma ferramenta de recuperação ou rotação de chave e não deve ser usado para substituir uma instalação ativa. Em Unix, arquivos privados são criados com modo 0600 e diretório 0700; no Windows, configure ACLs equivalentes. Os modos POSIX não constituem uma garantia de ACL do Windows.

## Variáveis

Copie opcionalmente `.env.example` para `.env.local`. O launcher lê esse arquivo antes do bootstrap. Variáveis já definidas no ambiente têm precedência.

| Variável | Padrão | Função |
| --- | --- | --- |
| `PORT` | `3012` | Porta do servidor; inteiro de 1024 a 65535 |
| `HOST` | `127.0.0.1` | Interface de escuta do launcher Node |
| `GOVTECH_ORIGIN` | `http://127.0.0.1:<PORT>` | Origem exata para operações de escrita |
| `GOVTECH_DATA_DIR` | `.data` | Diretório privado de contas, chaves e SQLite |
| `GOVTECH_METRICS_TOKEN` | ausente | Token opcional de métricas; mínimo de 32 caracteres |

`GOVTECH_ORIGIN` deve conter somente esquema HTTP(S), host e porta, sem caminho ou barra final. `localhost` e `127.0.0.1` são origens diferentes. No reverse proxy, configure a URL HTTPS pública exata; não habilite CORS genérico para contornar erros de origem.

Exemplo Windows PowerShell, com diretório separado e outra porta:

```powershell
$env:PORT = '3020'
$env:GOVTECH_ORIGIN = 'http://127.0.0.1:3020'
$env:GOVTECH_DATA_DIR = 'D:\dados-govtech-laboratorio'
pnpm dev
```

Exemplo shell Unix:

```sh
PORT=3020 GOVTECH_ORIGIN=http://127.0.0.1:3020 GOVTECH_DATA_DIR="$HOME/.local/share/arkhe-govtech-lab" pnpm dev
```

Não use diretório de dados compartilhado entre instâncias com código ou configuração distintos sem qualificação. Não aponte diretamente para o banco do Intra: os formatos e nomes de arquivo são diferentes.

## Produção local

```sh
pnpm build
pnpm start
```

O build gera `.next/standalone/server.js`. O launcher copia `public` e os assets estáticos para a distribuição standalone, executa o setup sem sobrescrever contas e inicia o servidor com diretório privado absoluto. Esse procedimento evita depender de `next start` em uma configuração standalone.

O perfil continua sendo local e sintético após um build de produção. `NODE_ENV=production` não qualifica integração pública, autenticação institucional, multi-tenancy ou resiliência operacional.

## Docker Compose

```sh
docker compose up --build -d
docker compose logs govtech
```

A receita usa Node 24, usuário não root, volume de dados e bind de porta somente em `127.0.0.1`. A origem externa precisa coincidir com `GOVTECH_ORIGIN`. A imagem cria suas contas dentro do volume; consulte o arquivo de credenciais desse volume por um procedimento administrativo seguro. Não copie suas credenciais de desenvolvimento para a imagem.

O `Dockerfile` e o Compose são receitas entregues. O relatório de testes informa se um build de contêiner foi efetivamente executado nesta publicação. Não se presume Docker/Podman validado apenas porque o arquivo existe.

## Dados de demonstração

```sh
pnpm demo:seed --confirm-synthetic
```

Esse comando é destinado ao laboratório e usa as contas/chaves locais para produzir exemplos reais do fluxo, todos identificados como fictícios. Ele gera um processo executado, um em revisão, um rascunho e um rejeitado. Não altera a parada ativa; não sobrescreve referências `DEMO-001` a `DEMO-004` já existentes. Não execute em uma instalação com dados institucionais.

## Problemas comuns

| Sintoma | Conferir |
| --- | --- |
| `node:sqlite` indisponível | Versão do Node; não substituir por pacote SQLite diferente sem testes |
| 403 de origem | URL usada pelo navegador versus `GOVTECH_ORIGIN`, inclusive porta e esquema |
| Conta ausente | Diretório efetivo de dados e execução anterior do setup |
| Assinatura falha | Chave da conta revisora, arquivo PKCS#8 e contexto seguro do navegador |
| 409 na execução | Revisão obsoleta, emergência, política alterada ou autorização ausente |
| Erro de build no Windows | Usar `pnpm build`, que inclui o adaptador de links; não copiar `node_modules` de outro OS |
| Banco bloqueado | Processo concorrente, volume e permissões; não repetir efeitos manualmente |
| Porta ocupada | Usar outra porta e origem correspondentes, preservando o serviço existente |
