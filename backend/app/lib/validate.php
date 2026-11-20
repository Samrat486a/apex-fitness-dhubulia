<?php
declare(strict_types=1);

/*
 * Small input helpers. Each returns the cleaned value and records a message in $errors
 * (field → message) when the value is invalid, so an endpoint can validate a whole form
 * and answer with every problem at once.
 */

/** @param array<string,string> $errors */
function v_string(array $in, string $field, array &$errors, int $min = 1, int $max = 255, string $label = ''): string
{
    $value = isset($in[$field]) && is_scalar($in[$field]) ? trim((string) $in[$field]) : '';
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';
    $label = $label ?: ucfirst(str_replace('_', ' ', $field));
    $len = mb_strlen($value);
    if ($min > 0 && $len === 0) {
        $errors[$field] = "$label is required.";
    } elseif ($len < $min) {
        $errors[$field] = "$label must be at least $min characters.";
    } elseif ($len > $max) {
        $errors[$field] = "$label must be at most $max characters.";
    }
    return $value;
}

/** Multi-line text: keeps line breaks, trims. */
function v_text(array $in, string $field, array &$errors, int $min, int $max, string $label): string
{
    $value = isset($in[$field]) && is_scalar($in[$field]) ? trim(str_replace("\r\n", "\n", (string) $in[$field])) : '';
    $len = mb_strlen($value);
    if ($min > 0 && $len === 0) {
        $errors[$field] = "$label is required.";
    } elseif ($len < $min) {
        $errors[$field] = "$label must be at least $min characters.";
    } elseif ($len > $max) {
        $errors[$field] = "$label must be at most $max characters.";
    }
    return $value;
}

function v_email(array $in, string $field, array &$errors): string
{
    $value = strtolower(trim((string) ($in[$field] ?? '')));
    if ($value === '') {
        $errors[$field] = 'Email is required.';
    } elseif (strlen($value) > 190 || !filter_var($value, FILTER_VALIDATE_EMAIL)) {
        $errors[$field] = 'Enter a valid email address.';
    }
    return $value;
}

/** Indian mobile numbers (10 digits, optional +91 / 0 prefix). Stored as +91XXXXXXXXXX. */
function v_phone(array $in, string $field, array &$errors, bool $required = true): ?string
{
    $raw = trim((string) ($in[$field] ?? ''));
    if ($raw === '') {
        if ($required) {
            $errors[$field] = 'Phone number is required.';
        }
        return null;
    }
    $digits = preg_replace('/\D+/', '', $raw) ?? '';
    if (strlen($digits) === 12 && str_starts_with($digits, '91')) {
        $digits = substr($digits, 2);
    } elseif (strlen($digits) === 11 && str_starts_with($digits, '0')) {
        $digits = substr($digits, 1);
    }
    if (!preg_match('/^[6-9]\d{9}$/', $digits)) {
        $errors[$field] = 'Enter a valid 10-digit mobile number.';
        return null;
    }
    return '+91' . $digits;
}

/** YYYY-MM-DD date. Optional bounds are inclusive. */
function v_date(array $in, string $field, array &$errors, string $label, bool $required = true, ?string $min = null, ?string $max = null): ?string
{
    $raw = trim((string) ($in[$field] ?? ''));
    if ($raw === '') {
        if ($required) {
            $errors[$field] = "$label is required.";
        }
        return null;
    }
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $raw);
    if (!$d || $d->format('Y-m-d') !== $raw) {
        $errors[$field] = "$label must be a valid date.";
        return null;
    }
    if ($min !== null && $raw < $min) {
        $errors[$field] = "$label is too far in the past.";
    } elseif ($max !== null && $raw > $max) {
        $errors[$field] = "$label can't be that far in the future.";
    }
    return $raw;
}

function v_int(array $in, string $field, array &$errors, int $min, int $max, string $label): int
{
    $raw = $in[$field] ?? null;
    if (!is_numeric($raw) || (int) $raw != $raw) {
        $errors[$field] = "$label must be a whole number.";
        return 0;
    }
    $n = (int) $raw;
    if ($n < $min || $n > $max) {
        $errors[$field] = "$label must be between $min and $max.";
    }
    return $n;
}

/** @param list<string> $allowed */
function v_enum(array $in, string $field, array &$errors, array $allowed, string $label, bool $required = true): ?string
{
    $value = trim((string) ($in[$field] ?? ''));
    if ($value === '') {
        if ($required) {
            $errors[$field] = "$label is required.";
        }
        return null;
    }
    if (!in_array($value, $allowed, true)) {
        $errors[$field] = "Choose a valid $label.";
        return null;
    }
    return $value;
}

function v_bool(array $in, string $field, bool $default = false): bool
{
    if (!array_key_exists($field, $in)) {
        return $default;
    }
    return filter_var($in[$field], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
}

function v_password(array $in, string $field, array &$errors): string
{
    $value = (string) ($in[$field] ?? '');
    if ($value === '') {
        $errors[$field] = 'Password is required.';
    } elseif (strlen($value) < 8) {
        $errors[$field] = 'Use at least 8 characters.';
    } elseif (strlen($value) > 128) {
        $errors[$field] = 'Password is too long.';
    } elseif (!preg_match('/[A-Za-z]/', $value) || !preg_match('/\d/', $value)) {
        $errors[$field] = 'Use letters and at least one number.';
    }
    return $value;
}

/** Stop with HTTP 422 if any field failed. */
function fail_if_errors(array $errors, string $message = 'Please check the highlighted fields.'): void
{
    if ($errors) {
        json_error($message, 422, $errors, 'VALIDATION_FAILED');
    }
}
