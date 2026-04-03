<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    protected string $webhookUrl;

    public function __construct()
    {
        $this->webhookUrl = config('services.n8n.webhook_url');
    }

    public function generate(string $systemPrompt, string $userPrompt): string
    {
        Log::info('AiService: calling n8n webhook', [
            'url' => $this->webhookUrl,
            'system_prompt_length' => strlen($systemPrompt),
            'user_prompt_length' => strlen($userPrompt),
        ]);

        $response = Http::asJson()->timeout(180)->post($this->webhookUrl, [
            'system_prompt' => $systemPrompt,
            'user_prompt' => $userPrompt,
        ]);

        Log::info('AiService: n8n response', [
            'status' => $response->status(),
            'body_preview' => substr($response->body(), 0, 500),
        ]);

        $response->throw();

        $data = $response->json();

        // Handle both array and object response formats
        $item = is_array($data) && array_is_list($data) ? ($data[0] ?? $data) : $data;

        $result = $item['result'] ?? $item['ouput']['result'] ?? '';

        if (empty($result)) {
            Log::warning('AiService: could not extract result from response', [
                'keys' => is_array($item) ? array_keys($item) : 'not_array',
                'raw' => substr(json_encode($data), 0, 500),
            ]);
        }

        return $result;
    }
}
