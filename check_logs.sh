#!/bin/bash

# Script para facilitar a visualização de logs
# Uso: ./check_logs.sh [opção]

cd /app

echo "=========================================="
echo "🔍 VERIFICADOR DE LOGS - ECO-VACS"
echo "=========================================="
echo ""

# Menu se nenhum argumento for passado
if [ $# -eq 0 ]; then
    echo "Escolha uma opção:"
    echo ""
    echo "  1) Ver últimos 50 logs"
    echo "  2) Ver últimos 100 logs"
    echo "  3) Ver apenas ERROS (últimos 20)"
    echo "  4) Ver erros de SAQUE"
    echo "  5) Ver erros de USUÁRIO/ADMIN"
    echo "  6) Ver logs em TEMPO REAL"
    echo "  7) Ver logs de HOJE"
    echo "  8) Buscar erro ESPECÍFICO"
    echo "  9) Ver ESTATÍSTICAS"
    echo " 10) LIMPAR logs antigos"
    echo ""
    read -p "Digite o número da opção: " opcao
else
    opcao=$1
fi

case $opcao in
    1)
        echo "📄 Últimos 50 logs:"
        echo "=========================================="
        tail -50 storage/logs/laravel.log
        ;;
    2)
        echo "📄 Últimos 100 logs:"
        echo "=========================================="
        tail -100 storage/logs/laravel.log
        ;;
    3)
        echo "❌ Últimos 20 ERROS:"
        echo "=========================================="
        grep "ERROR" storage/logs/laravel.log | tail -20
        ;;
    4)
        echo "💰 Erros de SAQUE:"
        echo "=========================================="
        grep -i "saque\|withdrawal" storage/logs/laravel.log | tail -30
        ;;
    5)
        echo "👤 Erros de USUÁRIO/ADMIN:"
        echo "=========================================="
        grep -i "user\|admin" storage/logs/laravel.log | tail -30
        ;;
    6)
        echo "⏱️  Logs em TEMPO REAL (Ctrl+C para parar):"
        echo "=========================================="
        tail -f storage/logs/laravel.log
        ;;
    7)
        echo "📅 Logs de HOJE:"
        echo "=========================================="
        grep "$(date +%Y-%m-%d)" storage/logs/laravel.log | tail -50
        ;;
    8)
        read -p "Digite o termo a buscar: " termo
        echo "🔎 Buscando '$termo':"
        echo "=========================================="
        grep -i "$termo" storage/logs/laravel.log | tail -30
        ;;
    9)
        echo "📊 ESTATÍSTICAS:"
        echo "=========================================="
        echo ""
        
        total_linhas=$(wc -l < storage/logs/laravel.log)
        echo "Total de linhas no log: $total_linhas"
        
        total_erros=$(grep -c "ERROR" storage/logs/laravel.log)
        echo "Total de ERROS: $total_erros"
        
        total_warnings=$(grep -c "WARNING" storage/logs/laravel.log)
        echo "Total de WARNINGS: $total_warnings"
        
        tamanho=$(ls -lh storage/logs/laravel.log | awk '{print $5}')
        echo "Tamanho do arquivo: $tamanho"
        
        echo ""
        echo "Erros de hoje: $(grep "$(date +%Y-%m-%d)" storage/logs/laravel.log | grep -c "ERROR")"
        echo ""
        echo "TOP 5 Erros mais frequentes:"
        grep "ERROR" storage/logs/laravel.log | cut -d':' -f4-5 | sort | uniq -c | sort -rn | head -5
        ;;
    10)
        echo "🗑️  LIMPAR LOGS ANTIGOS"
        echo "=========================================="
        echo ""
        
        tamanho_antes=$(ls -lh storage/logs/laravel.log | awk '{print $5}')
        echo "Tamanho atual: $tamanho_antes"
        
        read -p "⚠️  Deseja fazer backup antes? (s/n): " backup
        
        if [ "$backup" = "s" ]; then
            cp storage/logs/laravel.log storage/logs/laravel.log.backup.$(date +%Y%m%d_%H%M%S)
            echo "✓ Backup criado!"
        fi
        
        read -p "⚠️  Confirma LIMPAR o log? (s/n): " confirma
        
        if [ "$confirma" = "s" ]; then
            > storage/logs/laravel.log
            echo "✓ Log limpo com sucesso!"
        else
            echo "Operação cancelada."
        fi
        ;;
    *)
        echo "❌ Opção inválida!"
        echo ""
        echo "Use: ./check_logs.sh [1-10]"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Comando executado com sucesso!"
echo "=========================================="

