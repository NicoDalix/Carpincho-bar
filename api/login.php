<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/validation.php';
require_once __DIR__ . '/../includes/jwt.php';
require_once __DIR__ . '/../includes/security.php';

handleOptions();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método no permitido', 405);
}

/**
 * Responde 429 indicando cuánto falta para poder volver a intentar.
 */
function respuestaBloqueado(int $segundos): void
{
    $minutos = (int) ceil($segundos / 60);
    header('Retry-After: ' . $segundos);
    jsonResponse([
        'error' => 'Demasiados intentos fallidos. Probá de nuevo en '
            . $minutos . ($minutos === 1 ? ' minuto.' : ' minutos.'),
        'retry_after' => $segundos,
    ], 429);
}

try {
    initDatabase();
    $body = getJsonBody();

    $email = trim(strtolower($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    $emailCheck = validateEmail($email);
    if (!$emailCheck['valid']) {
        jsonError($emailCheck['error']);
    }

    if ($password === '') {
        jsonError('La contraseña es obligatoria.');
    }

    $pdo = getDB();
    $ip = obtenerIp();

    // ¿Está bloqueado por demasiados intentos? (se chequea antes de mirar la contraseña)
    $espera = loginSegundosBloqueado($pdo, $ip);
    if ($espera > 0) {
        respuestaBloqueado($espera);
    }

    $stmt = $pdo->prepare('SELECT id, email, password, nombre, rol FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !verifyPassword($password, $user['password'])) {
        $bloqueo = loginRegistrarFallo($pdo, $ip);
        if ($bloqueo > 0) {
            respuestaBloqueado($bloqueo);
        }
        jsonError('Credenciales inválidas', 401);
    }
    
    $rol = $user['rol'] ?? 'usuario';
    $token = createJWT([
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'rol' => $rol,
    ]);

    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'nombre' => $user['nombre'],
            'rol' => $rol,
        ],
    ]);
} catch (PDOException $e) {
    jsonError('Error en el login', 500);
}
