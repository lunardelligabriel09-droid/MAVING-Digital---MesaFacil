
# encerrando o mysql

$mysqladmin = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqladmin.exe"
$senha = Read-Host -Prompt "Senha do root do MySQL" -AsSecureString
$senhaTexto = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha))


