<?php
// Ejecutar una vez: http://localhost/<proyecto>/database/install.php
require_once __DIR__ . '/../public/app/config.php';

header('Content-Type: text/html; charset=utf-8');

$ipCliente = $_SERVER['REMOTE_ADDR'] ?? '';
if (PHP_SAPI !== 'cli' && !in_array($ipCliente, ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    exit('Acceso denegado: la instalación solo puede ejecutarse desde el servidor.');
}

$messages = [];

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $dbName = str_replace('`', '``', DB_NAME);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbName`");

    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $statements = array_filter(array_map('trim', explode(';', $schema)));

    foreach ($statements as $statement) {
        if ($statement !== '') {
            $pdo->exec($statement);
        }
    }

    $messages[] = 'Base de datos y tablas creadas correctamente.';

    require_once __DIR__ . '/../public/app/db.php';
    initDatabase();
    $messages[] = 'Datos iniciales insertados (admin, mesas, carta).';
    $messages[] = 'Usuario administrador: ' . htmlspecialchars(ADMIN_EMAIL);
} catch (PDOException $e) {
    $messages[] = 'Error: ' . htmlspecialchars($e->getMessage());
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Instalación - Restaurante</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .ok { color: #2e7d32; }
        .error { color: #c62828; }
    </style>
</head>
<body>
    <h1>Instalación MySQL</h1>
    <?php foreach ($messages as $msg): ?>
        <p class="<?php echo str_starts_with($msg, 'Error') ? 'error' : 'ok'; ?>"><?php echo $msg; ?></p>
    <?php endforeach; ?>
    <p><a href="../public/index.html">Ir a la aplicación</a></p>
</body>
</html>
