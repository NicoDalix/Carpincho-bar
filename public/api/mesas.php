<?php
require_once __DIR__ . '/../app/helpers.php';
require_once __DIR__ . '/../app/db.php';
require_once __DIR__ . '/../app/reservas.php';

handleOptions();
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no permitido', 405);
}

try {
    $pdo = getDB();

    $mesas = $pdo->query('SELECT id, numero, sector, capacidad, tarifa_minima FROM mesas ORDER BY id')->fetchAll();

    $timestamp = parsearFechaReserva($_GET['fechaHora'] ?? date('Y-m-d\TH:i:s'));

    $ocupadas = array_map('intval', array_column(reservasSolapadas($pdo, $timestamp), 'mesa_id'));

    $result = [];
    foreach ($mesas as $mesa) {
        $formatted = mesaToArray($mesa);
        $formatted['disponible'] = !in_array((int) $mesa['id'], $ocupadas, true);
        $result[] = $formatted;
    }

    jsonResponse($result);
} catch (PDOException $e) {
    jsonError('Error al obtener las mesas', 500);
}
