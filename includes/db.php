<?php
require_once __DIR__ . '/../api/config.php';
require_once __DIR__ . '/security.php';

function getDB(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    return $pdo;
}

function initDatabase(): void
{
    $pdo = getDB();

    // Intentos fallidos de login (bloqueo temporal)
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS login_intentos (
            ip VARCHAR(45) NOT NULL PRIMARY KEY,
            intentos INT NOT NULL DEFAULT 0,
            bloqueado_hasta INT UNSIGNED NOT NULL DEFAULT 0,
            ventana_inicio INT UNSIGNED NOT NULL DEFAULT 0
        )'
    );

    // Usuario admin por defecto
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->execute([ADMIN_EMAIL]);
    if (!$stmt->fetch()) {
        $hash = hashPassword(ADMIN_PASSWORD);
        $insert = $pdo->prepare(
            'INSERT INTO usuarios (email, password, nombre, rol) VALUES (?, ?, ?, ?)'
        );
        $insert->execute([ADMIN_EMAIL, $hash, ADMIN_NOMBRE, 'admin']);
    }

    // Mesas
    $count = (int) $pdo->query('SELECT COUNT(*) FROM mesas')->fetchColumn();
    if ($count === 0) {
        $insertMesa = $pdo->prepare(
            'INSERT INTO mesas (numero, sector, capacidad, tarifa_minima) VALUES (?, ?, ?, ?)'
        );

        for ($i = 1; $i <= 10; $i++) {
            $insertMesa->execute([$i, 'interior', $i <= 5 ? 4 : 6, 5000]);
        }
        for ($i = 11; $i <= 15; $i++) {
            $insertMesa->execute([$i, 'exclusivo', 4, 10000]);
        }
        for ($i = 16; $i <= 25; $i++) {
            $insertMesa->execute([$i, 'patio', $i <= 20 ? 4 : 6, 7000]);
        }
    }

    // Carta platos
    $platosCount = (int) $pdo->query('SELECT COUNT(*) FROM carta_platos')->fetchColumn();
    if ($platosCount === 0) {
        $platos = [
            ['Bruschetta', 20000, 'Entradas'],
            ['Carpaccio de Res', 35000, 'Entradas'],
            ['Ensalada César', 15000, 'Entradas'],
            ['Provoleta a la Parrilla', 14000, 'Entradas'],
            ['Pasta Carbonara', 20000, 'Platos Principales'],
            ['Risotto de Hongos', 25000, 'Platos Principales'],
            ['Salmón a la Plancha', 35000, 'Platos Principales'],
            ['Bife de Chorizo', 15000, 'Platos Principales'],
            ['Pollo al Vino', 12000, 'Platos Principales'],
            ['Lasagna Casera', 18000, 'Platos Principales'],
            ['Tiramisú', 13000, 'Postres'],
            ['Flan Casero', 10000, 'Postres'],
            ['Brownie con Helado', 11000, 'Postres'],
            ['Cheesecake de Frutos Rojos', 12500, 'Postres'],
        ];
        $stmt = $pdo->prepare('INSERT INTO carta_platos (nombre, precio, categoria) VALUES (?, ?, ?)');
        foreach ($platos as $plato) {
            $stmt->execute($plato);
        }
    }

    // Carta bebidas
    $bebidasCount = (int) $pdo->query('SELECT COUNT(*) FROM carta_bebidas')->fetchColumn();
    if ($bebidasCount === 0) {
        $bebidas = [
            ['Agua Mineral', 3000, 'Sin Alcohol'],
            ['Agua con Gas', 3000, 'Sin Alcohol'],
            ['Coca Cola', 4200, 'Sin Alcohol'],
            ['Sprite', 4200, 'Sin Alcohol'],
            ['Jugo de Naranja Natural', 4500, 'Sin Alcohol'],
            ['Vino Tinto Reserva', 24500, 'Vinos'],
            ['Vino Blanco', 15000, 'Vinos'],
            ['Vino Rosado', 1600, 'Vinos'],
            ['Malbec Premium', 50000, 'Vinos'],
            ['Cerveza Artesanal IPA', 12500, 'Cervezas'],
            ['Cerveza Artesanal Lager', 12500, 'Cervezas'],
            ['Cerveza Artesanal Stout', 12500, 'Cervezas'],
            ['Champagne', 18500, 'Espumantes'],
            ['Espumante Nacional', 14500, 'Espumantes'],
            ['Prosecco', 16000, 'Espumantes'],
        ];
        $stmt = $pdo->prepare('INSERT INTO carta_bebidas (nombre, precio, categoria) VALUES (?, ?, ?)');
        foreach ($bebidas as $bebida) {
            $stmt->execute($bebida);
        }
    }
}
