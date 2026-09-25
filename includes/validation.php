<?php

/**
 * Valida que la contraseña cumpla los requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una letra
 * - Al menos un número
 */
function validatePassword(string $password): array
{
    if (strlen($password) < 8) {
        return [
            'valid' => false,
            'error' => 'La contraseña debe tener al menos 8 caracteres.',
        ];
    }

    if (!preg_match('/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/', $password)) {
        return [
            'valid' => false,
            'error' => 'La contraseña debe incluir al menos una letra.',
        ];
    }

    if (!preg_match('/[0-9]/', $password)) {
        return [
            'valid' => false,
            'error' => 'La contraseña debe incluir al menos un número.',
        ];
    }

    return ['valid' => true];
}

function validateEmail(string $email): array
{
    $email = trim($email);

    if ($email === '') {
        return ['valid' => false, 'error' => 'El email es obligatorio.'];
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['valid' => false, 'error' => 'El email no es válido.'];
    }

    return ['valid' => true];
}

function validateNombre(string $nombre): array
{
    $nombre = trim($nombre);

    if ($nombre === '') {
        return ['valid' => false, 'error' => 'El nombre es obligatorio.'];
    }

    if (strlen($nombre) < 2) {
        return ['valid' => false, 'error' => 'El nombre debe tener al menos 2 caracteres.'];
    }

    return ['valid' => true];
}
