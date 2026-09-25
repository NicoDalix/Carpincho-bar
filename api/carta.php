<?php
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/db.php';

handleOptions();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no permitido', 405);
}

try {
    initDatabase();
    $pdo = getDB();

    $platos = $pdo->query('SELECT id, nombre, precio, categoria FROM carta_platos ORDER BY id')->fetchAll();
    $bebidas = $pdo->query('SELECT id, nombre, precio, categoria FROM carta_bebidas ORDER BY id')->fetchAll();

    $formatItem = function (array $item): array {
        return [
            'id' => (int) $item['id'],
            'nombre' => $item['nombre'],
            'precio' => (float) $item['precio'],
            'categoria' => $item['categoria'],
        ];
    };

    jsonResponse([
        'platos' => array_map($formatItem, $platos),
        'bebidas' => array_map($formatItem, $bebidas),
    ]);
} catch (PDOException $e) {
    jsonError('Error al obtener la carta', 500);
}
