# 🚀 Regras para Novo Projeto Laravel + React + Vizzion Pay

## Stack Tecnológica

### Backend
- **Framework:** Laravel 11 / PHP 8.2+
- **Banco de Dados:** PostgreSQL
- **APIs:** Apenas `/api/*` (sem rotas web)
- **Autenticação:** Laravel Sanctum

### Frontend
- **Framework:** React 18+ com TypeScript
- **Build Tool:** Vite
- **Localização:** `resources/js`
- **Roteamento:** React Router (SPA)
- **UI:** Shadcn/UI + Tailwind CSS + Framer Motion

### Gateway de Pagamento
- **Provider:** Vizzion Pay
- **Métodos:** PIX (cobranças e transferências)
- **Webhooks:** Confirmação automática de pagamentos

---

## 🏗️ Estrutura de Pastas

```
projeto/
├── app/
│   ├── Http/
│   │   ├── Controllers/API/V1/
│   │   │   ├── AuthController.php
│   │   │   ├── DepositController.php
│   │   │   ├── WithdrawController.php
│   │   │   └── WebhookController.php
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Deposit.php
│   │   ├── Withdrawal.php
│   │   ├── Ledger.php
│   │   └── WebhookEvent.php
│   ├── Services/
│   │   └── VizzionPayService.php
│   └── Jobs/
│       └── ProcessWebhookJob.php
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/
│   ├── js/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   └── app.tsx
│   └── css/
└── routes/
    └── api.php
```

---

## 📦 Dependências Necessárias

### Backend (composer.json)
```json
{
    "require": {
        "php": "^8.2",
        "laravel/framework": "^11.0",
        "laravel/sanctum": "^4.0",
        "guzzlehttp/guzzle": "^7.8"
    }
}
```

### Frontend (package.json)
```json
{
    "dependencies": {
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^6.26.0",
        "axios": "^1.7.4",
        "zod": "^3.23.8",
        "@radix-ui/react-*": "latest",
        "tailwindcss": "^3.4.0",
        "framer-motion": "^11.3.0"
    }
}
```

---

## 🔐 Configuração .env

```env
# App
APP_NAME="Seu Projeto"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=seu_projeto
DB_USERNAME=postgres
DB_PASSWORD=senha

# Vizzion Pay API
PAYMENT_API_URL=https://app.vizzionpay.com/api/v1
PAYMENT_API_KEY=seu_public_key
PAYMENT_API_SECRET=seu_secret_key
PAYMENT_MOCK=false

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:8000/api

# CORS
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173
```

---

## 🎯 Regras do Agente (Cursor AI)

### Gerais
1. **Sempre gerar código completo e colável** - Nunca usar "..." ou omitir partes
2. **APIs versionadas** - Todas em `/api/v1/...`
3. **Migrations + Seeders** - Sempre criar quando adicionar recursos
4. **FormRequests para validação** - Nunca validar no controller
5. **Resources para respostas** - Padronizar saídas JSON
6. **Transações em operações financeiras** - Sempre usar `DB::beginTransaction()`
7. **Nunca expor segredos** - Tudo em `.env`
8. **Logs estruturados** - Com contexto e rastreabilidade

### Pagamentos
9. **Telefone sempre aleatório válido** - Formato: `(11) 9XXXX-XXXX`
10. **IP fixo para Vizzion** - Usar IP público válido
11. **Normalizar nomes** - Remover acentos e caracteres especiais
12. **Idempotência em webhooks** - Verificar duplicatas
13. **Ledger para auditoria** - Registrar TODAS as movimentações financeiras

### Frontend
14. **Sem console.log em produção** - Usar `esbuild.drop: ['console']`
15. **Debounce em buscas** - 500ms mínimo
16. **Loading states** - Sempre mostrar feedback ao usuário
17. **Tratamento de erros** - Exibir mensagens amigáveis

---

## 💾 Migrations Essenciais

### 1. Users Table
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('phone')->nullable();
    $table->string('cpf', 11)->nullable()->unique();
    $table->string('password');
    $table->string('role')->default('user'); // user, admin
    $table->decimal('balance', 18, 2)->default(0); // Saldo para usar
    $table->decimal('balance_withdrawn', 18, 2)->default(0); // Saldo para sacar
    $table->string('referral_code', 20)->unique();
    $table->timestamps();
    
    $table->index(['email', 'cpf', 'referral_code']);
});
```

### 2. Deposits Table
```php
Schema::create('deposits', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->decimal('amount', 18, 2);
    $table->string('transaction_id')->nullable()->unique();
    $table->string('order_id')->nullable();
    $table->enum('status', ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'])->default('PENDING');
    $table->text('qr_code')->nullable(); // PIX copia e cola
    $table->text('qr_code_base64')->nullable();
    $table->text('qr_code_image')->nullable(); // URL da imagem
    $table->string('order_url')->nullable();
    $table->jsonb('raw_response')->nullable();
    $table->timestamp('paid_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'status', 'transaction_id']);
});
```

### 3. Withdrawals Table
```php
Schema::create('withdrawals', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->decimal('amount', 18, 2);
    $table->decimal('fee_amount', 18, 2)->default(0);
    $table->decimal('net_amount', 18, 2); // Valor líquido
    $table->string('cpf', 11);
    $table->string('pix_key');
    $table->enum('pix_key_type', ['cpf', 'email', 'phone', 'random']);
    $table->enum('status', ['REQUESTED', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED']);
    $table->string('transaction_id')->nullable();
    $table->jsonb('raw_response')->nullable();
    $table->text('error_message')->nullable();
    $table->text('rejection_reason')->nullable();
    $table->timestamp('requested_at')->nullable();
    $table->timestamp('approved_at')->nullable();
    $table->timestamp('paid_at')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'status']);
});
```

### 4. Ledger Table (Extrato/Auditoria)
```php
Schema::create('ledger', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->enum('type', ['DEPOSIT', 'WITHDRAWAL', 'EARNING', 'COMMISSION', 'REFUND', 'ADJUSTMENT']);
    $table->string('reference_type')->nullable(); // Model class
    $table->unsignedBigInteger('reference_id')->nullable(); // Model ID
    $table->text('description');
    $table->decimal('amount', 18, 2); // SEMPRE POSITIVO
    $table->enum('operation', ['CREDIT', 'DEBIT']); // Direção da operação
    $table->enum('balance_type', ['balance', 'balance_withdrawn'])->default('balance_withdrawn');
    $table->jsonb('metadata')->nullable();
    $table->timestamps();
    
    $table->index(['user_id', 'type', 'created_at']);
    $table->index(['reference_type', 'reference_id']);
});
```

### 5. Webhook Events Table
```php
Schema::create('webhook_events', function (Blueprint $table) {
    $table->id();
    $table->string('provider')->default('vizzion'); // vizzion, stripe, etc
    $table->string('event_id')->unique(); // ID do evento do provider
    $table->string('event_type'); // payment.paid, transfer.completed, etc
    $table->string('reference_type')->nullable(); // Deposit, Withdrawal
    $table->unsignedBigInteger('reference_id')->nullable();
    $table->jsonb('payload');
    $table->enum('status', ['PENDING', 'PROCESSED', 'FAILED'])->default('PENDING');
    $table->text('error_message')->nullable();
    $table->timestamp('processed_at')->nullable();
    $table->timestamps();
    
    $table->index(['event_id', 'status', 'reference_type', 'reference_id']);
});
```

---

## 🔌 Vizzion Pay Service

### Classe Base (app/Services/VizzionPayService.php)

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VizzionPayService
{
    protected string $apiUrl;
    protected string $apiKey;
    protected string $apiSecret;
    protected bool $mockMode;

    public function __construct()
    {
        $this->apiUrl = config('services.vizzion.api_url');
        $this->apiKey = config('services.vizzion.api_key');
        $this->apiSecret = config('services.vizzion.api_secret');
        $this->mockMode = config('services.vizzion.mock', false);
    }

    /**
     * Criar cobrança PIX
     */
    public function createPixCharge(array $data): array
    {
        if ($this->mockMode) {
            return $this->mockPixCharge($data);
        }

        try {
            $headers = [
                'x-public-key' => $this->apiKey,
                'x-secret-key' => $this->apiSecret,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ];

            $http = Http::withHeaders($headers)->timeout(20);
            
            if (config('app.env') !== 'production') {
                $http = $http->withoutVerifying();
            }

            $url = rtrim($this->apiUrl, '/') . '/gateway/orders';
            
            Log::info('Vizzion PIX Charge Request', ['url' => $url, 'data' => $data]);
            
            $response = $http->post($url, $data);

            if ($response->failed()) {
                Log::error('Vizzion Charge Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => data_get($response->json(), 'message', 'Erro ao gerar cobrança PIX'),
                    'details' => $response->json() ?: ['status' => $response->status()],
                ];
            }

            $result = $response->json();
            $order = $result['order'] ?? [];
            $charge = $order['charge'] ?? [];
            $pix = $charge['pix'] ?? [];

            return [
                'success' => true,
                'transaction_id' => $charge['id'] ?? null,
                'order_id' => $order['id'] ?? null,
                'status' => $charge['status'] ?? 'PENDING',
                'qr_code' => $pix['qrCode'] ?? null,
                'qr_code_base64' => $pix['base64'] ?? null,
                'qr_code_image' => $pix['image'] ?? null,
                'order_url' => $order['orderUrl'] ?? null,
                'expires_at' => $charge['expiresAt'] ?? null,
                'raw_response' => $result,
            ];

        } catch (\Throwable $e) {
            Log::error('Vizzion Charge Exception', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Criar transferência PIX (saque)
     */
    public function createPixTransfer(array $data): array
    {
        if ($this->mockMode) {
            return $this->mockPixTransfer($data);
        }

        try {
            $headers = [
                'x-public-key' => $this->apiKey,
                'x-secret-key' => $this->apiSecret,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ];

            $http = Http::withHeaders($headers)->timeout(20);
            
            if (config('app.env') !== 'production') {
                $http = $http->withoutVerifying();
            }

            $url = rtrim($this->apiUrl, '/') . '/gateway/transfers';
            
            Log::info('Vizzion PIX Transfer Request', ['url' => $url, 'data' => $data]);
            
            $response = $http->post($url, $data);

            if ($response->failed()) {
                Log::error('Vizzion Transfer Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => data_get($response->json(), 'message', 'Erro na transferência PIX'),
                    'details' => $response->json() ?: ['status' => $response->status()],
                ];
            }

            $result = $response->json();
            $withdraw = $result['withdraw'] ?? [];

            return [
                'success' => true,
                'transaction_id' => $withdraw['id'] ?? null,
                'status' => $withdraw['status'] ?? 'PROCESSING',
                'raw_response' => $result,
            ];

        } catch (\Throwable $e) {
            Log::error('Vizzion Transfer Exception', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Consultar status de transação
     */
    public function getTransaction(string $transactionId): array
    {
        try {
            $headers = [
                'x-public-key' => $this->apiKey,
                'x-secret-key' => $this->apiSecret,
                'Accept' => 'application/json',
            ];

            $http = Http::withHeaders($headers)->timeout(20);
            
            $url = rtrim($this->apiUrl, '/') . '/gateway/orders/' . $transactionId;
            
            $response = $http->get($url);

            if ($response->failed()) {
                return ['success' => false, 'error' => 'Erro ao consultar transação'];
            }

            return [
                'success' => true,
                'data' => $response->json(),
            ];

        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Mock para testes (sem chamar API real)
     */
    private function mockPixCharge(array $data): array
    {
        return [
            'success' => true,
            'transaction_id' => 'MOCK-' . uniqid(),
            'order_id' => 'ORDER-' . uniqid(),
            'status' => 'PENDING',
            'qr_code' => '00020126580014br.gov.bcb.pix...',
            'qr_code_base64' => 'iVBORw0KGgoAAAANSUhEUgAA...',
            'qr_code_image' => 'https://example.com/qr.png',
            'order_url' => 'https://example.com/order/123',
            'expires_at' => now()->addMinutes(30)->toIso8601String(),
            'raw_response' => ['mocked' => true],
        ];
    }

    private function mockPixTransfer(array $data): array
    {
        return [
            'success' => true,
            'transaction_id' => 'TRANSFER-' . uniqid(),
            'status' => 'PROCESSING',
            'raw_response' => ['mocked' => true],
        ];
    }
}
```

---

## 🎣 Webhook Controller

### app/Http/Controllers/API/V1/WebhookController.php

```php
<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\Withdrawal;
use App\Models\WebhookEvent;
use App\Models\Ledger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Webhook da Vizzion Pay
     */
    public function vizzion(Request $request)
    {
        try {
            $payload = $request->all();
            
            Log::info('Vizzion Webhook Received', ['payload' => $payload]);

            // Extrair dados do webhook
            $eventId = data_get($payload, 'id') ?? data_get($payload, 'eventId');
            $eventType = data_get($payload, 'type') ?? data_get($payload, 'event');
            $chargeId = data_get($payload, 'charge.id') ?? data_get($payload, 'chargeId');
            $status = data_get($payload, 'charge.status') ?? data_get($payload, 'status');

            if (!$eventId || !$chargeId) {
                Log::warning('Webhook sem IDs necessários', ['payload' => $payload]);
                return response()->json(['message' => 'Event ID ou Charge ID ausente'], 400);
            }

            // Verificar idempotência (evitar processar o mesmo evento duas vezes)
            $existingEvent = WebhookEvent::where('event_id', $eventId)->first();
            
            if ($existingEvent && $existingEvent->status === 'PROCESSED') {
                Log::info('Webhook já processado', ['event_id' => $eventId]);
                return response()->json(['message' => 'Webhook já processado'], 200);
            }

            // Criar ou atualizar registro do webhook
            $webhookEvent = WebhookEvent::updateOrCreate(
                ['event_id' => $eventId],
                [
                    'provider' => 'vizzion',
                    'event_type' => $eventType ?? 'unknown',
                    'payload' => $payload,
                    'status' => 'PENDING',
                ]
            );

            // Processar pagamento se status for PAID/APPROVED/CONFIRMED
            if (in_array(strtoupper($status), ['PAID', 'APPROVED', 'CONFIRMED'])) {
                $this->processPayment($chargeId, $webhookEvent);
            }

            return response()->json(['message' => 'Webhook recebido com sucesso'], 200);

        } catch (\Exception $e) {
            Log::error('Erro ao processar webhook Vizzion', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['message' => 'Erro ao processar webhook'], 500);
        }
    }

    /**
     * Processar pagamento confirmado
     */
    private function processPayment(string $chargeId, WebhookEvent $webhookEvent): void
    {
        DB::beginTransaction();

        try {
            // Buscar depósito pelo transaction_id
            $deposit = Deposit::where('transaction_id', $chargeId)
                ->where('status', 'PENDING')
                ->first();

            if (!$deposit) {
                Log::warning('Depósito não encontrado para webhook', [
                    'charge_id' => $chargeId,
                ]);
                $webhookEvent->update([
                    'status' => 'FAILED',
                    'error_message' => 'Depósito não encontrado',
                ]);
                DB::commit();
                return;
            }

            // Marcar depósito como pago
            $deposit->update([
                'status' => 'PAID',
                'paid_at' => now(),
            ]);

            // Creditar saldo do usuário
            $user = $deposit->user;
            $user->balance += $deposit->amount;
            $user->save();

            // Registrar no ledger (extrato)
            Ledger::create([
                'user_id' => $user->id,
                'type' => 'DEPOSIT',
                'reference_type' => Deposit::class,
                'reference_id' => $deposit->id,
                'description' => sprintf(
                    'Depósito PIX confirmado - R$ %s',
                    number_format($deposit->amount, 2, ',', '.')
                ),
                'amount' => $deposit->amount,
                'operation' => 'CREDIT',
                'balance_type' => 'balance',
            ]);

            // Marcar webhook como processado
            $webhookEvent->update([
                'reference_type' => Deposit::class,
                'reference_id' => $deposit->id,
                'status' => 'PROCESSED',
                'processed_at' => now(),
            ]);

            DB::commit();

            Log::info('Pagamento processado com sucesso', [
                'deposit_id' => $deposit->id,
                'user_id' => $user->id,
                'amount' => $deposit->amount,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            $webhookEvent->update([
                'status' => 'FAILED',
                'error_message' => $e->getMessage(),
            ]);

            Log::error('Erro ao processar pagamento do webhook', [
                'error' => $e->getMessage(),
                'charge_id' => $chargeId,
            ]);

            throw $e;
        }
    }
}
```

---

## 🔄 Rotas API (routes/api.php)

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\DepositController;
use App\Http\Controllers\API\V1\WithdrawController;
use App\Http\Controllers\API\V1\WebhookController;

// Webhook (público - sem autenticação)
Route::post('/v1/webhooks/vizzion', [WebhookController::class, 'vizzion'])
    ->name('api.v1.webhooks.vizzion');

// Rotas autenticadas
Route::prefix('v1')->group(function () {
    // Autenticação
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        // Depósitos
        Route::get('/deposits', [DepositController::class, 'index']);
        Route::post('/deposits', [DepositController::class, 'store']);
        Route::get('/deposits/{id}', [DepositController::class, 'show']);
        Route::post('/deposits/{id}/check-status', [DepositController::class, 'checkStatus']);
        
        // Saques
        Route::get('/withdrawals', [WithdrawController::class, 'index']);
        Route::post('/withdrawals', [WithdrawController::class, 'store']);
        Route::get('/withdrawals/{id}', [WithdrawController::class, 'show']);
        Route::get('/withdrawals/settings', [WithdrawController::class, 'settings']);
    });
});
```

---

## ⚙️ Configuração do Vite

### vite.config.js

```javascript
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    esbuild: {
        jsx: 'automatic',
        jsxDev: false,
        drop: ['console', 'debugger'], // Remove console.log em produção
    },
    build: {
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
});
```

---

## 🔒 Middleware de Admin

### app/Http/Middleware/AdminMiddleware.php

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Acesso negado. Apenas administradores.',
                ]
            ], 403);
        }

        return $next($request);
    }
}
```

### Registrar no bootstrap/app.php

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'admin' => \App\Http\Middleware\AdminMiddleware::class,
    ]);
})
```

---

## 📝 Checklist de Implementação

### Backend
- [ ] Instalar Laravel 11 + PostgreSQL
- [ ] Configurar `.env` com credenciais Vizzion
- [ ] Criar migrations (users, deposits, withdrawals, ledger, webhook_events)
- [ ] Implementar `VizzionPayService`
- [ ] Criar controllers (Auth, Deposit, Withdraw, Webhook)
- [ ] Configurar rotas em `api.php`
- [ ] Implementar middleware de admin
- [ ] Configurar CORS e Sanctum

### Frontend
- [ ] Instalar React + TypeScript + Vite
- [ ] Configurar Tailwind CSS + Shadcn/UI
- [ ] Criar context de autenticação
- [ ] Implementar páginas (Login, Deposit, Withdraw)
- [ ] Configurar Axios com interceptors
- [ ] Adicionar debounce em buscas
- [ ] Remover console.logs (config do Vite)

### Testes
- [ ] Testar depósito via Vizzion (mock mode)
- [ ] Testar webhook de confirmação
- [ ] Testar saque via Vizzion
- [ ] Verificar ledger (auditoria)
- [ ] Testar idempotência de webhooks

---

## 🚨 Pontos Críticos de Atenção

### Segurança
1. **NUNCA** expor `PAYMENT_API_SECRET` no frontend
2. **SEMPRE** validar webhooks (idempotência)
3. **SEMPRE** usar transações em operações financeiras
4. **SEMPRE** registrar no ledger

### Performance
1. Usar **debounce** em buscas (500ms)
2. **Paginar** listas de usuários/transações
3. **Índices** nas tabelas (user_id, status, created_at)
4. **Cache** de configurações quando possível

### Vizzion Pay
1. **Telefone** - Sempre gerar válido: `(11) 9XXXX-XXXX`
2. **IP** - Usar IP público válido (não 127.0.0.1)
3. **Nome** - Remover acentos e caracteres especiais
4. **CPF** - Formatar com pontos e traço: `XXX.XXX.XXX-XX`

---

## 📚 Documentação Adicional

- **Vizzion Pay Docs:** https://docs.vizzionpay.com
- **Laravel Sanctum:** https://laravel.com/docs/11.x/sanctum
- **React Router:** https://reactrouter.com
- **Shadcn/UI:** https://ui.shadcn.com

---

## 💡 Dicas Finais

1. **Comece pelo backend** - Migrations, models, service
2. **Teste com mock mode** - Evite cobrar de verdade durante dev
3. **Use logs estruturados** - Facilita debug
4. **Documente suas APIs** - Use Postman ou Swagger
5. **Faça commits frequentes** - Facilita rollback se necessário

---

🎉 **Projeto pronto para decolar!**

