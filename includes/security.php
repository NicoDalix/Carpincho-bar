<?php
/**
 * Módulo de ciberseguridad - Hash de contraseñas con bcrypt
 *
 * bcrypt es un algoritmo de hash unidireccional diseñado para contraseñas.
 * Nunca se guarda la contraseña en texto plano: solo el hash.
 * Al iniciar sesión, password_verify() compara la contraseña ingresada con el hash.
 *
 * Cada hash incluye un "salt" aleatorio, por lo que dos contraseñas iguales
 * producen hashes distintos (protección contra tablas rainbow).
 */
define('BCRYPT_COST', 12);

function hashPassword(string $plainPassword): string
{
    return password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

function verifyPassword(string $plainPassword, string $storedHash): bool
{
    return password_verify($plainPassword, $storedHash);
}

define('LOGIN_MAX_INTENTOS', 5);
define('LOGIN_BLOQUEO_SEGUNDOS', 300); // 5 minutos de bloqueo
define('LOGIN_VENTANA_SEGUNDOS', 300); // los 5 fallos tienen que darse dentro de 5 minutos

/** IP del cliente. No se usa X-Forwarded-For porque el cliente lo puede falsear. */
function obtenerIp(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/** Segundos que le faltan al bloqueo de esa IP (0 si no está bloqueada). */
function loginSegundosBloqueado(PDO $pdo, string $ip): int
{
    $stmt = $pdo->prepare('SELECT bloqueado_hasta FROM login_intentos WHERE ip = ? LIMIT 1');
    $stmt->execute([$ip]);
    $hasta = (int) $stmt->fetchColumn();

    return max(0, $hasta - time());
}

/**
 * Suma un intento fallido de esa IP. Si llega al límite, la bloquea.
 * Devuelve los segundos de bloqueo si quedó bloqueada, o 0 si todavía no.
 */
function loginRegistrarFallo(PDO $pdo, string $ip): int
{
    $ahora = time();

    // Si la ventana de conteo ya venció, se arranca de cero
    $pdo->prepare(
        'UPDATE login_intentos SET intentos = 0, ventana_inicio = ?
         WHERE ip = ? AND ventana_inicio < ?'
    )->execute([$ahora, $ip, $ahora - LOGIN_VENTANA_SEGUNDOS]);

    $pdo->prepare(
        'INSERT INTO login_intentos (ip, intentos, bloqueado_hasta, ventana_inicio) VALUES (?, 1, 0, ?)
         ON DUPLICATE KEY UPDATE intentos = intentos + 1'
    )->execute([$ip, $ahora]);

    $stmt = $pdo->prepare('SELECT intentos FROM login_intentos WHERE ip = ? LIMIT 1');
    $stmt->execute([$ip]);
    $intentos = (int) $stmt->fetchColumn();

    if ($intentos < LOGIN_MAX_INTENTOS) {
        return 0;
    }

    $pdo->prepare('UPDATE login_intentos SET intentos = 0, bloqueado_hasta = ? WHERE ip = ?')
        ->execute([$ahora + LOGIN_BLOQUEO_SEGUNDOS, $ip]);

    return LOGIN_BLOQUEO_SEGUNDOS;
}
