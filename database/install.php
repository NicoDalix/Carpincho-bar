<?php
/**
 * Script de instalación: crea las tablas e inserta datos iniciales.
 * Ejecutar una vez: http://localhost/tu-proyecto/database/install.php
 */
require_once __DIR__ . '/../api/config.php';

header('Content-Type: text/html; charset=utf-8');

$messages = [];

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $statements = array_filter(array_map('trim', explode(';', $schema)));

    foreach ($statements as $statement) {
        if ($statement !== '') {
            $pdo->exec($statement);
        }
    }

    $messages[] = 'Base de datos y tablas creadas correctamente.';

    require_once __DIR__ . '/../includes/db.php';
    initDatabase();
    $messages[] = 'Datos iniciales insertados (admin, mesas, carta).';
    $messages[] = 'Admin: ' . ADMIN_EMAIL . ' / ' . ADMIN_PASSWORD;
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
