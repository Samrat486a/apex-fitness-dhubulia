<?php
declare(strict_types=1);

/*
 * Email delivery. Drivers (config mail.driver):
 *   log  → writes the message to storage/logs (local development, nothing leaves the machine)
 *   smtp → minimal SMTP client (SSL on 465 or STARTTLS on 587) with AUTH LOGIN
 *   mail → PHP mail()
 *
 * send_mail() never throws: it returns [ok, error] so the reminder job can record a
 * failed delivery and move on to the next member.
 */

/** @return array{0:bool,1:?string} */
function send_mail(string $to, string $subject, string $text, string $html): array
{
    $driver = (string) config('mail.driver', 'log');
    try {
        if ($driver === 'log') {
            log_line('mail', "To: $to | Subject: $subject | " . str_replace("\n", ' ', $text));
            return [true, null];
        }
        $message = build_mime_message($to, $subject, $text, $html);
        if ($driver === 'mail') {
            $ok = mail($to, encode_header($subject), $message['body'], implode("\r\n", $message['headers']));
            return $ok ? [true, null] : [false, 'mail() returned false'];
        }
        smtp_send($to, $message);
        return [true, null];
    } catch (Throwable $e) {
        log_error('Mail to ' . $to . ' failed: ' . $e->getMessage());
        return [false, mb_substr($e->getMessage(), 0, 480)];
    }
}

function encode_header(string $value): string
{
    return preg_match('/[^\x20-\x7E]/', $value) ? '=?UTF-8?B?' . base64_encode($value) . '?=' : $value;
}

/** @return array{headers:list<string>,body:string,subject:string} */
function build_mime_message(string $to, string $subject, string $text, string $html): array
{
    $boundary = 'apex_' . bin2hex(random_bytes(12));
    $fromEmail = (string) config('mail.from_email');
    $fromName = (string) config('mail.from_name', 'Apex Fitness');
    $domain = substr(strrchr($fromEmail, '@') ?: '@localhost', 1);

    $headers = [
        'From: ' . encode_header($fromName) . ' <' . $fromEmail . '>',
        'Reply-To: ' . (setting('gym_email') ?: $fromEmail),
        'MIME-Version: 1.0',
        'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $domain . '>',
        'Date: ' . date(DATE_RFC2822),
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];
    $body = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text))
        . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--$boundary--\r\n";

    return ['headers' => $headers, 'body' => $body, 'subject' => encode_header($subject)];
}

function smtp_send(string $to, array $message): void
{
    $host = (string) config('mail.host');
    $port = (int) config('mail.port', 465);
    $enc = (string) config('mail.encryption', 'ssl');
    $remote = ($enc === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;

    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
    $fp = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) {
        throw new RuntimeException("SMTP connect failed: $errstr ($errno)");
    }
    stream_set_timeout($fp, 15);

    $read = static function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 515)) !== false) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };
    $cmd = static function (string $command, array $expect) use ($fp, $read): string {
        if ($command !== '') {
            fwrite($fp, $command . "\r\n");
        }
        $reply = $read();
        if (!in_array((int) substr($reply, 0, 3), $expect, true)) {
            throw new RuntimeException('SMTP error after "' . explode(' ', $command)[0] . '": ' . trim($reply));
        }
        return $reply;
    };

    try {
        $ehloHost = parse_url((string) config('app_url', 'http://localhost'), PHP_URL_HOST) ?: 'localhost';
        $cmd('', [220]);
        $cmd('EHLO ' . $ehloHost, [250]);
        if ($enc === 'tls') {
            $cmd('STARTTLS', [220]);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) {
                throw new RuntimeException('STARTTLS negotiation failed');
            }
            $cmd('EHLO ' . $ehloHost, [250]);
        }
        if ((string) config('mail.username') !== '') {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode((string) config('mail.username')), [334]);
            $cmd(base64_encode((string) config('mail.password')), [235]);
        }
        $cmd('MAIL FROM:<' . config('mail.from_email') . '>', [250]);
        $cmd('RCPT TO:<' . $to . '>', [250, 251]);
        $cmd('DATA', [354]);

        $data = implode("\r\n", array_merge($message['headers'], ['To: <' . $to . '>', 'Subject: ' . $message['subject']]))
            . "\r\n\r\n" . $message['body'];
        // Dot-stuffing: a line starting with "." must be doubled.
        $data = preg_replace('/^\./m', '..', $data) ?? $data;
        $cmd($data . "\r\n.", [250]);
        $cmd('QUIT', [221]);
    } finally {
        fclose($fp);
    }
}

/** Branded HTML wrapper for reminder emails. */
function email_layout(string $heading, string $bodyHtml, string $ctaLabel, string $ctaUrl): string
{
    $h = static fn (string $s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    $gym = public_gym_info();
    return '<!doctype html><html><body style="margin:0;background:#f3f4f1;font-family:Arial,Helvetica,sans-serif;color:#0b0f12">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e3e5e0">'
        . '<tr><td style="background:#0b0f12;padding:18px 28px;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:2px">'
        . '<img src="' . $h(rtrim((string) config('app_url', ''), '/') . '/brand/apex-logo-email.png') . '" width="120" height="83" alt="APEX FITNESS" style="display:block;border:0;width:120px;height:auto;color:#ffffff">'
        . '</td></tr>'
        . '<tr><td style="padding:28px">'
        . '<h1 style="margin:0 0 12px;font-size:22px">' . $h($heading) . '</h1>'
        . '<div style="font-size:15px;line-height:1.6;color:#3a4148">' . $bodyHtml . '</div>'
        . '<p style="margin:24px 0 0"><a href="' . $h($ctaUrl) . '" style="display:inline-block;background:#06b6d4;color:#0b0f12;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">' . $h($ctaLabel) . '</a></p>'
        . '</td></tr>'
        . '<tr><td style="padding:18px 28px;background:#f7f8f6;font-size:12px;color:#6b737a">'
        . $h($gym['name']) . ' · ' . $h($gym['address']) . ' · ' . $h($gym['phone'])
        . '<br>You receive this because you linked your membership on our website. Manage alerts in your dashboard profile.'
        . '</td></tr></table></td></tr></table></body></html>';
}
