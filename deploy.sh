#!/bin/bash

# Configurações do servidor
SERVER_USER="alan" # Ajuste conforme seu usuário no servidor
SERVER_IP="192.168.100.117"
REMOTE_DIR="~/nubank_trae" # Diretório onde a aplicação ficará no servidor

echo "🚀 Iniciando deploy para $SERVER_IP..."

# 1. Build do Frontend
echo "📦 Gerando build do frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build. Abortando."
    exit 1
fi

# 2. Preparar arquivos para envio
echo "🗂️ Preparando arquivos..."
# Criar diretório temporário
mkdir -p deploy_temp

# Copiar arquivos necessários
cp -r dist deploy_temp/
cp -r server deploy_temp/
cp package.json deploy_temp/
cp package-lock.json deploy_temp/
cp vite.config.js deploy_temp/

# 3. Enviar arquivos para o servidor
echo "📤 Enviando arquivos para o servidor..."
# Cria o diretório remoto se não existir
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# Sincroniza os arquivos (exceto node_modules e data)
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'data' \
    deploy_temp/ $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# Limpar temporários
rm -rf deploy_temp

# 4. Instalar dependências e reiniciar serviço no servidor
echo "🔄 Atualizando dependências e reiniciando..."
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $REMOTE_DIR
    
    # Instalar dependências de produção
    npm install --production
    
    # Parar processos antigos (se estiver usando PM2)
    # Se não tiver PM2, ajuste para matar o node simples: pkill -f "node server/index.js" || true
    if command -v pm2 &> /dev/null; then
        pm2 restart nubank-app || pm2 start server/index.js --name "nubank-app"
    else
        echo "⚠️ PM2 não encontrado. Tentando reiniciar manualmente..."
        pkill -f "node server/index.js" || true
        nohup node server/index.js > app.log 2>&1 &
    fi
    
    echo "✅ Deploy concluído no servidor!"
EOF

echo "🎉 Processo finalizado com sucesso!"
