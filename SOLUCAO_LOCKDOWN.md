# 🔒 Solução: Erro "lockdown-install.js" + "can't detect preamble"

## 🎯 Causa Raiz Identificada

O erro **NÃO está no seu código**! Ele é causado por:

### "Removing unpermitted intrinsics" vem de:
- **Extensões do navegador** como MetaMask, Brave Wallet, ou outras wallets crypto
- Essas extensões injetam `lockdown-install.js` que modifica o ambiente JavaScript global
- Isso quebra o `@vitejs/plugin-react` que espera um ambiente "limpo"

### O erro "can't detect preamble" acontece porque:
- O plugin React tenta injetar código no início dos módulos (preamble)
- O lockdown modifica `Object`, `Array`, etc. do JavaScript
- O plugin não reconhece o ambiente modificado e falha

---

## ✅ Soluções (escolha uma)

### Solução 1: Desabilitar Fast Refresh (RECOMENDADO)
Já apliquei no `vite.config.js`:
```javascript
react({
    jsxRuntime: 'automatic',
    fastRefresh: false, // Desabilita Fast Refresh
}),
```

**Reinicie o Vite:**
```powershell
# Pare: Ctrl + C
npm run dev
```

---

### Solução 2: Usar modo Anônito / Desabilitar Extensões

**Chrome/Edge:**
1. Abra uma janela anônima: `Ctrl + Shift + N`
2. Acesse: `http://localhost:8000`

**Ou desabilite extensões:**
1. Chrome: `chrome://extensions`
2. Desabilite MetaMask, Brave Wallet, etc.
3. Recarregue a página

---

### Solução 3: Usar outro navegador
- Firefox (sem extensões)
- Safari
- Qualquer navegador sem wallets crypto

---

### Solução 4: Build de Produção
O erro só acontece no dev mode. Em produção funciona:
```powershell
npm run build
# Depois acesse http://localhost:8000
```

---

## 🧪 Como Testar

### Passo 1: Identifique a extensão
No console do navegador, antes do erro, deve aparecer algo como:
```
Removing unpermitted intrinsics
```
Isso confirma que é uma extensão.

### Passo 2: Teste em anônimo
- `Ctrl + Shift + N` (Chrome/Edge)
- Acesse `http://localhost:8000`
- Se funcionar = confirmado que é extensão

### Passo 3: Se ainda não funcionar
Use a Solução 1 (Fast Refresh desabilitado)

---

## 🎯 Resultado Esperado

Após aplicar Solução 1 e reiniciar Vite:
```
✓ Vite conectado
✓ React carregado
✓ Aplicação funcionando
```

**Sem erro de preamble!** 🎉

---

## 📝 Notas Técnicas

- `lockdown` é uma biblioteca do SES (Secure ECMAScript)
- Usado por Agoric, MetaMask, e outras apps crypto
- Modifica `Object.prototype`, `Array.prototype`, etc.
- Fast Refresh do React não é compatível com isso
- Desabilitar Fast Refresh resolve (você perde hot reload mas app funciona)

---

## 🔍 Verificar qual extensão está causando

No console do navegador, rode:
```javascript
console.log(window.lockdown);
```

Se retornar algo, confirma que há lockdown ativo.

---

**TL;DR:** Desabilitei o Fast Refresh no Vite. Reinicie o servidor (`npm run dev`) e o erro deve sumir! 🚀




