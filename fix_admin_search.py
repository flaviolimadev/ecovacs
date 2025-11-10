#!/usr/bin/env python3
import re

file_path = 'app/Http/Controllers/API/V1/Admin/UserController.php'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Codigo antigo (com ilike)
old_code = """        // Busca por nome, email ou CPF
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('cpf', 'like', "%{$search}%")
                  ->orWhere('referral_code', 'ilike', "%{$search}%");
            });
        }"""

# Codigo novo (com LOWER)
new_code = """        // Busca por nome, email, CPF ou código de indicação
        if ($search) {
            $searchLower = strtolower($search);
            $query->where(function ($q) use ($search, $searchLower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$searchLower}%"])
                  ->orWhere('cpf', 'LIKE', "%{$search}%")
                  ->orWhereRaw('LOWER(referral_code) LIKE ?', ["%{$searchLower}%"]);
            });
        }"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("OK - Arquivo atualizado!")
else:
    print("ERRO - Codigo antigo nao encontrado. Pode ja estar atualizado.")
    print("\nBuscando 'ilike' no arquivo...")
    if 'ilike' in content:
        # Mostrar contexto onde ilike aparece
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'ilike' in line.lower():
                print(f"Linha {i+1}: {line}")
    else:
        print("'ilike' nao encontrado - arquivo ja pode estar correto!")

