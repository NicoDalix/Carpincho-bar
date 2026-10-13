<?php
define('BCRYPT_COST', 12);

function hashPassword(string $plainPassword): string
{
    return password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

function verifyPassword(string $plainPassword, string $storedHash): bool
{
    return password_verify($plainPassword, $storedHash);
}

function sendSecurityHeaders(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
}

define('LOGIN_MAX_INTENTOS', 5);
define('LOGIN_BLOQUEO_SEGUNDOS', 300); 
define('LOGIN_VENTANA_SEGUNDOS', 300); 

// No uso X-Forwarded-For porque se puede falsear
function obtenerIp(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function loginSegundosBloqueado(PDO $pdo, string $ip): int
{
    $stmt = $pdo->prepare('SELECT bloqueado_hasta FROM login_intentos WHERE ip = ? LIMIT 1');
    $stmt->execute([$ip]);
    $hasta = (int) $stmt->fetchColumn();

    return max(0, $hasta - time());
}

function loginRegistrarFallo(PDO $pdo, string $ip): int
{
    $ahora = time();

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
