<?php
declare(strict_types=1);

/*
 * WhatsApp delivery. Drivers (config whatsapp.driver):
 *   log       → writes the message to storage/logs (local development)
 *   cloud_api → WhatsApp Business Cloud API (graph.facebook.com)
 *
 * Messages a business starts must use a pre-approved template. Reminders use the
 * template in whatsapp.template_name with body parameters {{1}} member name and
 * {{2}} days remaining. Other messages fall back to plain text, which WhatsApp only
 * delivers inside a 24-hour customer-service window.
 *
 * Like send_mail(), this never throws; it returns [ok, error].
 */

/** +91XXXXXXXXXX / 0XXXXXXXXXX / XXXXXXXXXX → 91XXXXXXXXXX (digits only, as the API expects). */
function whatsapp_number(?string $phone): ?string
{
    $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';
    if ($digits === '') {
        return null;
    }
    $cc = (string) config('whatsapp.default_country_code', '91');
    if (strlen($digits) === 10) {
        return $cc . $digits;
    }
    if (strlen($digits) === 11 && $digits[0] === '0') {
        return $cc . substr($digits, 1);
    }
    return $digits;
}

/**
 * @param array{name:string,days:int}|null $template  reminder template parameters
 * @return array{0:bool,1:?string}
 */
function send_whatsapp(string $phone, string $text, ?array $template = null): array
{
    $to = whatsapp_number($phone);
    if ($to === null) {
        return [false, 'No valid phone number'];
    }
    $driver = (string) config('whatsapp.driver', 'log');
    if ($driver === 'log') {
        log_line('whatsapp', "To: $to | " . str_replace("\n", ' ', $text));
        return [true, null];
    }
    if ($driver !== 'cloud_api') {
        return [false, 'Unknown WhatsApp driver'];
    }

    $phoneId = (string) config('whatsapp.phone_number_id');
    $token = (string) config('whatsapp.access_token');
    if ($phoneId === '' || $token === '') {
        return [false, 'WhatsApp Cloud API is not configured'];
    }

    $payload = ['messaging_product' => 'whatsapp', 'to' => $to];
    if ($template !== null && (string) config('whatsapp.template_name') !== '') {
        $payload['type'] = 'template';
        $payload['template'] = [
            'name'       => (string) config('whatsapp.template_name'),
            'language'   => ['code' => (string) config('whatsapp.template_lang', 'en')],
            'components' => [[
                'type'       => 'body',
                'parameters' => [
                    ['type' => 'text', 'text' => $template['name']],
                    ['type' => 'text', 'text' => (string) $template['days']],
                ],
            ]],
        ];
    } else {
        $payload['type'] = 'text';
        $payload['text'] = ['preview_url' => false, 'body' => $text];
    }

    $url = sprintf('https://graph.facebook.com/%s/%s/messages', config('whatsapp.api_version', 'v20.0'), rawurlencode($phoneId));
    try {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $token, 'Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode($payload),
        ]);
        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return [false, 'Network error: ' . $curlError];
        }
        if ($status < 200 || $status >= 300) {
            $decoded = json_decode((string) $response, true);
            $msg = $decoded['error']['message'] ?? ('HTTP ' . $status);
            log_error("WhatsApp to $to failed: $msg");
            return [false, mb_substr((string) $msg, 0, 480)];
        }
        return [true, null];
    } catch (Throwable $e) {
        log_error("WhatsApp to $to failed: " . $e->getMessage());
        return [false, mb_substr($e->getMessage(), 0, 480)];
    }
}
