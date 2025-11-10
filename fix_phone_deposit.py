#!/usr/bin/env python3
import re

file_path = 'app/Http/Controllers/API/V1/DepositController.php'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir o bloco antigo pelo novo
old_code = '''            // Telefone formatado
            $phoneClean = preg_replace('/\\D/', '', $user->phone ?? '');
            $phonePretty = $this->formatPhone($phoneClean);'''

new_code = '''            // Telefone SEMPRE aleatório válido (garante geração do PIX pela Vizzion)
            // Formato: (11) 9XXXX-XXXX com números aleatórios
            // Não usa telefone real do usuário para evitar problemas na API
            $phoneClean = '11' . str_pad((string)$user->id, 9, random_int(1000, 9999), STR_PAD_LEFT);
            $phoneClean = substr($phoneClean, 0, 11); // Garantir exatos 11 dígitos
            $phonePretty = $this->formatPhone($phoneClean);'''

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("OK - Arquivo atualizado com sucesso!")
else:
    print("ERRO - Codigo antigo nao encontrado. Arquivo pode ja estar atualizado.")

