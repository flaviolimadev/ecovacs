#!/bin/bash

echo "=========================================="
echo "LOGS DE ERRO DE SAQUE (Últimos 50)"
echo "=========================================="
echo ""

# Mostrar erros de saque dos últimos registros
grep -i "erro ao processar saque\|withdrawal\|ledger" storage/logs/laravel.log | tail -n 50

echo ""
echo "=========================================="
echo "ÚLTIMO ERRO COMPLETO (com stack trace)"
echo "=========================================="
echo ""

# Pegar o último erro completo (últimas 100 linhas do log)
tail -n 100 storage/logs/laravel.log

echo ""
echo "=========================================="
echo "Para ver logs em tempo real, execute:"
echo "tail -f storage/logs/laravel.log"
echo "=========================================="

