# MesaFacil - inicia o servidor MySQL local

# Este MySQL foi instalado apenas com os binarios (via winget), sem registro n windows
# Este script sobe o mysqld manualmente, apontando para a pasta de dados ja inicializada.

# Uso:
#   powershell -ExecutionPolicy Bypass -File database\start-mysql.ps1

$base = "C:\Program Files\MySQL\MySQL Server 8.4"
$dataDir = "C:\Users\lunar\mysql-mesafacil-data"
$mysqld = "$base\bin\mysqld.exe"

if (-not (Test-Path $mysqld)) {
    Write-Error "mysqld.exe nao encontrado em: $mysqld"
    exit 1
}

if (-not (Test-Path $dataDir)) {
    Write-Error "Pasta de dados nao encontrada em: $dataDir"
    exit 1
}

$existente = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
if ($existente) {
    Write-Output "MySQL ja esta em execucao na porta 3306. Nada a fazer."
    exit 0
}

Write-Output "Iniciando MySQL na porta 3306..."

#testando na maquina

$argString = "--datadir=`"$dataDir`" --basedir=`"$base`" --port=3306 --log-error=`"$dataDir\server.log`""

Start-Process -FilePath $mysqld -ArgumentList $argString -WindowStyle Hidden

Start-Sleep -Seconds 5

$conexao = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
if ($conexao) {
    Write-Output "MySQL iniciado com sucesso em localhost:3306."
} else {
    Write-Output "MySQL nao respondeu na porta 3306."
    Write-Output "Verifique o log: $dataDir\server.log"
}
