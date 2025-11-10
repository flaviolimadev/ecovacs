# Script PowerShell para exibir erros de saque

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "LOGS DE ERRO DE SAQUE (Últimos 50)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar erros relacionados a saque
Get-Content storage\logs\laravel.log | Select-String -Pattern "erro ao processar saque|withdrawal|ledger" -CaseSensitive:$false | Select-Object -Last 50

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ÚLTIMO ERRO COMPLETO (últimas 150 linhas)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Pegar as últimas 150 linhas do log
Get-Content storage\logs\laravel.log -Tail 150

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Para ver logs em tempo real, execute:" -ForegroundColor Green
Write-Host "Get-Content storage\logs\laravel.log -Wait" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green

