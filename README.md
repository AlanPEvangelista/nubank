# Nubank Aplicações — Deploy

Este projeto React + Vite contém duas opções de publicação para um servidor local Windows em `192.168.100.117`.

## Opção 1 — Publicação manual via GitHub (no próprio servidor)

Pré-requisitos no servidor (Windows):
- Git instalado e repositório acessível (HTTPS ou SSH).
- Node.js 20+ e npm.
- Porta desejada liberada no firewall (ex.: `8080`).

Passo a passo (no terminal do servidor 192.168.100.117):
- `git clone <url-do-repo> C:\apps\nubank\repo` (ou `git pull` se já existir)
- `cd C:\apps\nubank\repo`
- `npm ci`
- `npm run build`
- Publicar com preview do Vite:
  - `npm run preview -- --host 0.0.0.0 --port 8082`

Alternativa com script pronto:
- `powershell -ExecutionPolicy Bypass -File .\scripts\manual-deploy.ps1 -Port 8080 -HostAll`

Observações:
- Para publicação permanente, considere IIS apontando para `C:\apps\nubank\site` ou rodar um serviço com `vite preview`/`serve` usando agendador/serviço.

## Opção 2 — Publicação automática com GitHub Actions

O workflow `deploy.yml` builda e copia o conteúdo da pasta `dist` para o servidor Windows via SCP quando:
- Uma release é publicada com target `main`; ou
- O workflow é acionado manualmente (workflow_dispatch).

Configuração necessária no repositório (Secrets):
- `SSH_HOST`: `192.168.100.117`
- `SSH_USER`: Usuário com acesso ao SSH
- `SSH_KEY`: Chave privada do usuário (formato OpenSSH) — use `authorized_keys` no servidor
- `SSH_PORT`: Porta do SSH (padrão `22`)

Destino no servidor:
- O workflow copia arquivos para `C:/apps/nubank/site`.
- Configure seu servidor para servir arquivos estáticos dessa pasta (ex.: IIS).

Arquivo do workflow: `.github/workflows/deploy.yml`
- Checkout, Node 20, `npm ci`, `npm run build`
- Copia `dist/*` via `appleboy/scp-action` para `C:/apps/nubank/site`
- Passo remoto opcional de log com `appleboy/ssh-action`

Como disparar:
- Crie uma release na branch `main` (GitHub → Releases → Draft new release → target `main` → Publish)
- Ou acione manualmente em Actions → Deploy para 192.168.100.117 → Run workflow

### Preparando o servidor Windows para SSH (resumo)
- Instale o `OpenSSH Server` (Recursos Opcionais do Windows)
- Garanta que o serviço esteja em execução e a porta `22` liberada
- Crie/instale a chave pública em `%USERPROFILE%\.ssh\authorized_keys`
- Teste: `ssh <user>@192.168.100.117`

## Comandos úteis (dev)
- `npm run dev` — desenvolvimento (HMR)
- `npm run build` — build de produção
- `npm run preview` — serve o build (preview)

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
