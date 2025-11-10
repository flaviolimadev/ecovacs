#!/usr/bin/env python3
import re

print("=== Corrigindo AdminUserController ===")

# Fix Admin User Controller
file_path = 'app/Http/Controllers/API/V1/Admin/UserController.php'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Adicionar import do Schema
if 'use Illuminate\\Support\\Facades\\Schema;' not in content:
    content = content.replace(
        'use Illuminate\\Support\\Facades\\Validator;',
        'use Illuminate\\Support\\Facades\\Validator;\nuse Illuminate\\Support\\Facades\\Schema;'
    )
    print("OK - Import Schema adicionado")

# Substituir busca por CPF
old_search = """        // Busca por nome, email ou CPF
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('cpf', 'like', "%{$search}%")
                  ->orWhere('referral_code', 'ilike', "%{$search}%");
            });
        }"""

new_search = """        // Busca por nome, email, CPF (se existir) ou código de indicação
        if ($search) {
            $searchLower = strtolower($search);
            $query->where(function ($q) use ($search, $searchLower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(referral_code) LIKE ?', ["%{$searchLower}%"]);
                
                // Só busca por CPF se a coluna existir
                if (Schema::hasColumn('users', 'cpf')) {
                    $q->orWhereRaw('LOWER(cpf::text) LIKE ?', ["%{$searchLower}%"]);
                }
            });
        }"""

if old_search in content:
    content = content.replace(old_search, new_search)
    print("OK - Busca corrigida (com Schema::hasColumn)")
elif "Schema::hasColumn('users', 'cpf')" in content:
    print("OK - Busca ja esta corrigida")
else:
    print("AVISO - Busca nao encontrada, verificando padrao alternativo...")
    # Tentar substituir pelo padrão com LOWER já aplicado
    old_search2 = """        // Busca por nome, email, CPF ou código de indicação
        if ($search) {
            $searchLower = strtolower($search);
            $query->where(function ($q) use ($search, $searchLower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$searchLower}%"])
                  ->orWhere('cpf', 'LIKE', "%{$search}%")
                  ->orWhereRaw('LOWER(referral_code) LIKE ?', ["%{$searchLower}%"]);
            });
        }"""
    
    if old_search2 in content:
        content = content.replace(old_search2, new_search)
        print("OK - Busca corrigida (padrao alternativo)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n=== Corrigindo WithdrawController ===")

# Fix Withdraw Controller
file_path2 = 'app/Http/Controllers/API/V1/WithdrawController.php'

with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

# Adicionar balance_type ao Ledger::create do saque
old_ledger = """            Ledger::create([
                'user_id' => $user->id,
                'type' => 'WITHDRAWAL',
                'reference_type' => Withdrawal::class,
                'reference_id' => $withdrawal->id,
                'description' => sprintf(
                    "Saque PIX - R$ %s (Taxa: R$ %s | Líquido: R$ %s)",
                    number_format($amount, 2, ',', '.'),
                    number_format($feeAmount, 2, ',', '.'),
                    number_format($netAmount, 2, ',', '.')
                ),
                'amount' => $amount,
                'operation' => 'DEBIT',
            ]);"""

new_ledger = """            Ledger::create([
                'user_id' => $user->id,
                'type' => 'WITHDRAWAL',
                'reference_type' => Withdrawal::class,
                'reference_id' => $withdrawal->id,
                'description' => sprintf(
                    "Saque PIX - R$ %s (Taxa: R$ %s | Líquido: R$ %s)",
                    number_format($amount, 2, ',', '.'),
                    number_format($feeAmount, 2, ',', '.'),
                    number_format($netAmount, 2, ',', '.')
                ),
                'amount' => $amount,
                'operation' => 'DEBIT',
                'balance_type' => 'balance_withdrawn',
            ]);"""

if old_ledger in content2:
    content2 = content2.replace(old_ledger, new_ledger)
    print("OK - balance_type adicionado ao Ledger")
elif "'balance_type' => 'balance_withdrawn'" in content2:
    print("OK - balance_type ja existe no Ledger")
else:
    print("AVISO - Padrao de Ledger::create nao encontrado")

with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print("\nSUCESSO - Correcoes aplicadas com sucesso!")

