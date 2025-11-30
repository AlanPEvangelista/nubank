# Passo a Passo de Deploy Manual (Via GitHub)

Este guia descreve como atualizar a aplicação no servidor puxando as alterações diretamente do repositório GitHub.

**Dados do Ambiente:**
- **Repositório:** `AlanPEvangelista/nubank` (Verifique se o nome está correto)
- **Servidor:** `192.168.100.117`
- **Usuário:** `evangelista` (ou o seu usuário configurado)
- **Diretório:** `/home/alan/nubank_trae`

---

### 1. Acessar o Servidor
Conecte-se ao servidor via SSH:
```bash
ssh evangelista@192.168.100.117
```

### 2. Entrar no Diretório do Projeto
```bash
cd /home/alan/nubank_trae
```

### 3. Atualizar o Código (Git Pull)
Puxe as últimas alterações do branch principal (`main` ou `master`):
```bash
git pull origin main
```
*Nota: Se houver conflitos com arquivos locais, você pode usar `git stash` antes de puxar.*

### 4. Instalar Dependências e Gerar Build
Como houve atualizações de pacotes (bcrypt, jwt) e frontend, é necessário reinstalar e reconstruir:
```bash
# Instala dependências (incluindo devDependencies necessárias para o build)
npm install

# Gera a versão de produção na pasta 'dist'
npm run build
```

### 5. Reiniciar o Servidor (Sem PM2)
Como não estamos usando gerenciador de processos (PM2), vamos parar o processo antigo e iniciar um novo em segundo plano.

**Parar o processo antigo:**
```bash
pkill -f "node server/index.js"
```

**Iniciar o novo processo:**
```bash
nohup node server/index.js > app.log 2>&1 &
```

### 6. Verificação
Confira se o serviço subiu corretamente:

**Verificar processo rodando:**
```bash
ps aux | grep node
```

**Verificar logs de inicialização:**
```bash
tail -n 20 app.log
```
Você deve ver uma mensagem como: `API listening on http://0.0.0.0:3001...`
