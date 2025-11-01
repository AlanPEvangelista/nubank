# Uso:
#   powershell -ExecutionPolicy Bypass -File .\scripts\manual-deploy.ps1 -Port 8080 -HostAll
#
# Este script realiza o deploy manual em um servidor Windows:
# - Atualiza o código da branch main via Git
# - Instala dependências
# - Gera o build de produção
# - Inicializa preview do build com Vite (Ctrl+C para parar)

param(
  [int]$Port = 8080,
  [switch]$HostAll
)

Write-Host "[1/4] Atualizando código da branch main" -ForegroundColor Cyan
git fetch --all
git checkout main
git pull origin main

Write-Host "[2/4] Instalando dependências (npm ci)" -ForegroundColor Cyan
npm ci

Write-Host "[3/4] Gerando build (npm run build)" -ForegroundColor Cyan
npm run build

Write-Host "[4/4] Publicando preview do build (vite preview)" -ForegroundColor Cyan
if ($HostAll) {
  npm run preview -- --host 0.0.0.0 --port $Port
} else {
  npm run preview -- --port $Port
}