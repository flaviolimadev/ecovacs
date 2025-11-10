<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VizzionPayService
{
    private string $apiUrl;
    private string $apiKey;
    private string $apiSecret;

    public function __construct()
    {
        // Preferir vizzionpay (base_url) se disponível; fallback para vizzion
        $this->apiUrl = config('services.vizzionpay.base_url') ?? config('services.vizzion.api_url');
        $this->apiKey = config('services.vizzionpay.api_key') ?? config('services.vizzion.api_key');
        $this->apiSecret = config('services.vizzionpay.api_secret') ?? config('services.vizzion.api_secret');
    }

    /**
     * Criar uma cobrança PIX
     */
    public function createPixCharge(array $data): array
    {
        try {
            // Modo mock para desenvolvimento/contingência
            if (env('PAYMENT_MOCK')) {
                $txId = 'mock-' . uniqid();
                return [
                    'success' => true,
                    'transaction_id' => $txId,
                    'status' => 'OK',
                    'qr_code' => '00020101021126360014BR.GOV.BCB.PIX0114+55849999999952040000530398654041.005802BR5923Chrono60 Mock6009Fortaleza',
                    'qr_code_base64' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
                    'qr_code_image' => null,
                    'order_id' => 'mock-order-' . uniqid(),
                    'order_url' => 'https://example.com/order/mock',
                    'raw_response' => [
                        'mock' => true,
                    ],
                ];
            }

            // Primeiro: cabeçalhos exigidos pelo outro controller
            $headersPublicSecret = [
                'x-public-key' => $this->apiKey,
                'x-secret-key' => $this->apiSecret,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'Ecovacs-Laravel/1.0',
            ];

            $headersBearer = [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'X-API-Key' => $this->apiKey,
                'X-API-Secret' => $this->apiSecret,
                'Api-Key' => $this->apiKey,
                'Api-Secret' => $this->apiSecret,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'Ecovacs-Laravel/1.0',
            ];

            $headersBasic = [
                'Authorization' => 'Basic ' . base64_encode($this->apiKey . ':' . $this->apiSecret),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'Ecovacs-Laravel/1.0',
            ];

            if (config('app.debug')) {
                Log::info('Vizzion Pay Request (attempt=1 x-public/x-secret)', [
                    'url' => $this->apiUrl . '/gateway/pix/receive',
                    'headers' => ['x-public-key','x-secret-key'],
                    'payload' => $data,
                ]);
            }

            $http = Http::withHeaders($headersPublicSecret);

            // Opcional: desabilitar verificação SSL em dev
            if (config('app.env') !== 'production' && env('HTTP_DISABLE_SSL_VERIFY')) {
                $http = $http->withoutVerifying();
            }

            // Timeout customizável
            $timeout = (int) (env('HTTP_TIMEOUT_SECONDS', 15));
            $http = $http->timeout($timeout);

            $response = $http->post($this->apiUrl . '/gateway/pix/receive', $data);

            if ($response->failed()) {
                Log::error('Vizzion Pay API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                
                // Alguns provedores retornam 400 com corpo "válido" (contém pix/code)
                $json = null;
                try {
                    $json = $response->json();
                } catch (\Throwable $t) {
                    $json = null;
                }

                if (is_array($json) && (data_get($json, 'pix.code') || data_get($json, 'transactionId'))) {
                    return [
                        'success' => true,
                        'transaction_id' => $json['transactionId'] ?? null,
                        'status' => $json['status'] ?? null,
                        'qr_code' => data_get($json, 'pix.code'),
                        'qr_code_base64' => data_get($json, 'pix.base64'),
                        'qr_code_image' => data_get($json, 'pix.image'),
                        'order_id' => data_get($json, 'order.id'),
                        'order_url' => data_get($json, 'order.url'),
                        'raw_response' => $json,
                    ];
                }

                // Se 401 credenciais, tentar novamente com Bearer/x-api
                if ($response->status() === 401) {
                    if (config('app.debug')) {
                        Log::warning('Vizzion Pay retry with Bearer + x headers');
                    }

                    $http2 = Http::withHeaders($headersBearer)->timeout($timeout);
                    if (config('app.env') !== 'production' && env('HTTP_DISABLE_SSL_VERIFY')) {
                        $http2 = $http2->withoutVerifying();
                    }

                    $response2 = $http2->post($this->apiUrl . '/gateway/pix/receive', $data);

                    if ($response2->successful()) {
                        $result2 = $response2->json();
                        return [
                            'success' => true,
                            'transaction_id' => $result2['transactionId'] ?? null,
                            'status' => $result2['status'] ?? null,
                            'qr_code' => data_get($result2, 'pix.code'),
                            'qr_code_base64' => data_get($result2, 'pix.base64'),
                            'qr_code_image' => data_get($result2, 'pix.image'),
                            'order_id' => data_get($result2, 'order.id'),
                            'order_url' => data_get($result2, 'order.url'),
                            'raw_response' => $result2,
                        ];
                    }

                    // Tentar novamente com Basic (algumas variações)
                    $httpBasic = Http::withHeaders($headersBasic)->timeout($timeout);
                    if (config('app.env') !== 'production' && env('HTTP_DISABLE_SSL_VERIFY')) {
                        $httpBasic = $httpBasic->withoutVerifying();
                    }

                    $responseBasic = $httpBasic->post($this->apiUrl . '/gateway/pix/receive', $data);

                    if ($responseBasic->successful()) {
                        $resultB = $responseBasic->json();
                        return [
                            'success' => true,
                            'transaction_id' => $resultB['transactionId'] ?? null,
                            'status' => $resultB['status'] ?? null,
                            'qr_code' => data_get($resultB, 'pix.code'),
                            'qr_code_base64' => data_get($resultB, 'pix.base64'),
                            'qr_code_image' => data_get($resultB, 'pix.image'),
                            'order_id' => data_get($resultB, 'order.id'),
                            'order_url' => data_get($resultB, 'order.url'),
                            'raw_response' => $resultB,
                        ];
                    }

                    // Tentar novamente com cabeçalhos alternativos (sem Authorization)
                    $headersAlt = [
                        'X-API-KEY' => $this->apiKey,
                        'X-API-SECRET' => $this->apiSecret,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                        'User-Agent' => 'Ecovacs-Laravel/1.0',
                    ];

                    $http3 = Http::withHeaders($headersAlt)->timeout($timeout);
                    if (config('app.env') !== 'production' && env('HTTP_DISABLE_SSL_VERIFY')) {
                        $http3 = $http3->withoutVerifying();
                    }

                    $response3 = $http3->post($this->apiUrl . '/gateway/pix/receive', $data);

                    if ($response3->successful()) {
                        $result3 = $response3->json();
                        return [
                            'success' => true,
                            'transaction_id' => $result3['transactionId'] ?? null,
                            'status' => $result3['status'] ?? null,
                            'qr_code' => data_get($result3, 'pix.code'),
                            'qr_code_base64' => data_get($result3, 'pix.base64'),
                            'qr_code_image' => data_get($result3, 'pix.image'),
                            'order_id' => data_get($result3, 'order.id'),
                            'order_url' => data_get($result3, 'order.url'),
                            'raw_response' => $result3,
                        ];
                    }
                    
                    // Retornar erro do último retry
                    $json2 = null;
                    try { $json2 = $response3->json(); } catch (\Throwable) { $json2 = null; }

                    return [
                        'success' => false,
                        'error' => data_get($json2, 'message', 'Credenciais inválidas ou ausentes'),
                        'details' => $json2 ?: [
                            'status' => $response3->status(),
                            'body_raw' => $response3->body(),
                        ],
                    ];
                }

                return [
                    'success' => false,
                    'error' => data_get($json, 'message', 'Erro ao gerar cobrança PIX'),
                    'details' => $json ?: [
                        'status' => $response->status(),
                        'body_raw' => $response->body(),
                    ],
                ];
            }

            $result = $response->json();

            if (config('app.debug')) {
                Log::info('Vizzion Pay Response', $result ?? []);
            }

            return [
                'success' => true,
                'transaction_id' => $result['transactionId'] ?? null,
                'status' => $result['status'] ?? null,
                'qr_code' => $result['pix']['code'] ?? null,
                'qr_code_base64' => $result['pix']['base64'] ?? null,
                'qr_code_image' => $result['pix']['image'] ?? null,
                'order_id' => $result['order']['id'] ?? null,
                'order_url' => $result['order']['url'] ?? null,
                'raw_response' => $result,
            ];

        } catch (\Exception $e) {
            Log::error('Vizzion Pay Exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'Erro ao processar pagamento: ' . $e->getMessage(),
                'details' => [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                ],
            ];
        }
    }

    /**
     * Criar transferência PIX (saque) para o cliente
     */
    public function createPixTransfer(array $data): array
    {
        try {
            // Cabeçalhos estilo documentação oficial
            $headers = [
                'x-public-key' => $this->apiKey,
                'x-secret-key' => $this->apiSecret,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'Ecovacs-Laravel/1.0',
            ];

            $http = Http::withHeaders($headers)->timeout((int) (env('HTTP_TIMEOUT_SECONDS', 20)));

            if (config('app.env') !== 'production' && env('HTTP_DISABLE_SSL_VERIFY')) {
                $http = $http->withoutVerifying();
            }

            $url = rtrim($this->apiUrl, '/') . '/gateway/transfers';

            if (config('app.debug')) {
                Log::info('Vizzion Transfer Request', [
                    'url' => $url,
                    'payload' => $data,
                    'headers' => ['x-public-key','x-secret-key'],
                ]);
            }

            $response = $http->post($url, $data);

            if ($response->failed()) {
                Log::error('Vizzion Transfer Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => data_get($response->json(), 'message', 'Erro na transferência PIX'),
                    'details' => $response->json() ?: ['status' => $response->status(), 'body_raw' => $response->body()],
                ];
            }

            return [
                'success' => true,
                'raw_response' => $response->json(),
            ];

        } catch (\Throwable $e) {
            Log::error('Vizzion Transfer Exception', ['message' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Buscar status de uma transação
     */
    public function getTransaction(string $transactionId): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'X-API-Secret' => $this->apiSecret,
                'Accept' => 'application/json',
            ])->get($this->apiUrl . '/gateway/transaction/' . $transactionId);

            if ($response->failed()) {
                return [
                    'success' => false,
                    'error' => 'Erro ao buscar transação',
                ];
            }

            return [
                'success' => true,
                'data' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error('Vizzion Pay Get Transaction Exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Erro ao buscar transação: ' . $e->getMessage(),
            ];
        }
    }
}

