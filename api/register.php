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

try {
    initDatabase();
    $body = getJsonBody();

    $nombre = trim($body['nombre'] ?? '');
    $email = trim(strtolower($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    $nombreCheck = validateNombre($nombre);
    if (!$nombreCheck['valid']) {
        jsonError($nombreCheck['error']);
    }

    $emailCheck = validateEmail($email);
    if (!$emailCheck['valid']) {
        jsonError($emailCheck['error']);
    }

    $passwordCheck = validatePassword($password);
    if (!$passwordCheck['valid']) {
        jsonError($passwordCheck['error']);
    }

    $pdo = getDB();

    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonError('El email ya está registrado');
    }

    $hash = hashPassword($password);
    $insert = $pdo->prepare(
        'INSERT INTO usuarios (email, password, nombre, rol) VALUES (?, ?, ?, ?)'
    );
    $insert->execute([$email, $hash, $nombre, 'usuario']);
    $userId = (int) $pdo->lastInsertId();

    $token = createJWT([
        'id' => $userId,
        'email' => $email,
        'rol' => 'usuario',
    ]);

    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'nombre' => $nombre,
            'rol' => 'usuario',
        ],
    ]);
} catch (PDOException $e) {
    jsonError('Error en el registro', 500);
}
